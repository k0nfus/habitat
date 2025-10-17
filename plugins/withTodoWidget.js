const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_PROVIDER_CLASS = 'org.systemkritisch.habitat.widget.TodoWidgetProvider';

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const writeFileIfNeeded = (filePath, contents) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
};

const providerContent = `package org.systemkritisch.habitat.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import org.systemkritisch.habitat.R

class TodoWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    for (appWidgetId in appWidgetIds) {
      updateWidget(context, appWidgetManager, appWidgetId)
    }
  }

  companion object {
    private const val PREFS_NAME = "org.systemkritisch.habitat.widget.TodoWidget"
    private const val KEY_STATE = "state_json"

    fun updateAllWidgets(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, TodoWidgetProvider::class.java)
      val ids = manager.getAppWidgetIds(component)
      if (ids != null && ids.isNotEmpty()) {
        ids.forEach { updateWidget(context, manager, it) }
      }
    }

    fun storeState(context: Context, json: String?) {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      if (json.isNullOrEmpty()) {
        prefs.edit().remove(KEY_STATE).apply()
      } else {
        prefs.edit().putString(KEY_STATE, json).apply()
      }
    }

    private fun loadState(context: Context): JSONObject? {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val json = prefs.getString(KEY_STATE, null) ?: return null
      return try {
        JSONObject(json)
      } catch (_: Exception) {
        null
      }
    }

    private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.widget_todo)
      val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
      launchIntent?.let {
        it.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        val pending = PendingIntent.getActivity(
          context,
          0,
          it,
          PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        views.setOnClickPendingIntent(R.id.widgetRoot, pending)
      }

      val state = loadState(context)
      val title = state?.optString("title").takeUnless { it.isNullOrBlank() } ?: "Habitat Aufgaben"
      views.setTextViewText(R.id.widgetTitle, title)

      val subtitle = state?.optString("subtitle")
      if (subtitle.isNullOrBlank()) {
        views.setViewVisibility(R.id.widgetSubtitle, View.GONE)
      } else {
        views.setViewVisibility(R.id.widgetSubtitle, View.VISIBLE)
        views.setTextViewText(R.id.widgetSubtitle, subtitle)
      }

      val items = state?.optJSONArray("items") ?: JSONArray()
      if (items.length() == 0) {
        views.setViewVisibility(R.id.widgetItems, View.GONE)
        views.setViewVisibility(R.id.widgetEmpty, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.widgetItems, View.VISIBLE)
        views.setViewVisibility(R.id.widgetEmpty, View.GONE)
        val itemIds = intArrayOf(R.id.widgetItem1, R.id.widgetItem2, R.id.widgetItem3)
        for (i in itemIds.indices) {
          if (i < items.length()) {
            val obj = items.optJSONObject(i)
            val text = obj?.optString("text") ?: ""
            val completed = obj?.optBoolean("completed") ?: false
            val decorated = if (completed) "☑ $text" else "☐ $text"
            views.setViewVisibility(itemIds[i], View.VISIBLE)
            views.setTextViewText(itemIds[i], decorated)
          } else {
            views.setViewVisibility(itemIds[i], View.GONE)
          }
        }
      }

      appWidgetManager.updateAppWidget(appWidgetId, views)
    }
  }
}
`;

const moduleContent = `package org.systemkritisch.habitat.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TodoWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TodoWidget")

    AsyncFunction("setWidgetState") { json: String? ->
      val context = getApplicationContext() ?: return@AsyncFunction
      TodoWidgetProvider.storeState(context, json)
      TodoWidgetProvider.updateAllWidgets(context)
    }

    AsyncFunction("clearWidgetState") {
      val context = getApplicationContext() ?: return@AsyncFunction
      TodoWidgetProvider.storeState(context, null)
      TodoWidgetProvider.updateAllWidgets(context)
    }

    AsyncFunction("hasWidgets") {
      val context = getApplicationContext() ?: return@AsyncFunction false
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, TodoWidgetProvider::class.java)
      val ids = manager.getAppWidgetIds(component)
      ids != null && ids.isNotEmpty()
    }
  }

  private fun getApplicationContext(): Context? {
    return appContext.reactContext ?: appContext.currentActivity ?: appContext.context
  }
}
`;

const layoutContent = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widgetRoot"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:background="@drawable/widget_background"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:id="@+id/widgetTitle"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Habitat Aufgaben"
        android:textColor="@android:color/white"
        android:textSize="18sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widgetSubtitle"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:textColor="@android:color/white"
        android:textSize="12sp"
        android:visibility="gone" />

    <LinearLayout
        android:id="@+id/widgetItems"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="12dp"
        android:orientation="vertical">

        <TextView
            android:id="@+id/widgetItem1"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="6dp"
            android:textColor="@android:color/white"
            android:textSize="14sp" />

        <TextView
            android:id="@+id/widgetItem2"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="6dp"
            android:textColor="@android:color/white"
            android:textSize="14sp"
            android:visibility="gone" />

        <TextView
            android:id="@+id/widgetItem3"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="@android:color/white"
            android:textSize="14sp"
            android:visibility="gone" />
    </LinearLayout>

    <TextView
        android:id="@+id/widgetEmpty"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="12dp"
        android:text="Keine Aufgaben verfügbar"
        android:textColor="@android:color/white"
        android:textSize="14sp"
        android:visibility="gone" />
</LinearLayout>
`;

const backgroundDrawable = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#3A3F58" />
    <corners android:radius="16dp" />
</shape>
`;

const widgetInfoContent = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="0"
    android:initialLayout="@layout/widget_todo"
    android:widgetCategory="home_screen"
    android:resizeMode="horizontal|vertical" />
`;

module.exports = function withTodoWidget(config) {
  config = withDangerousMod(config, ['android', (config) => {
    const { platformProjectRoot } = config.modRequest;
    const appPath = path.join(platformProjectRoot, 'app');
    const mainPath = path.join(appPath, 'src', 'main');
    const javaPath = path.join(mainPath, 'java');
    const packagePath = path.join(javaPath, ...'org.systemkritisch.habitat.widget'.split('.'));
    const resPath = path.join(mainPath, 'res');

    writeFileIfNeeded(path.join(packagePath, 'TodoWidgetProvider.kt'), providerContent);
    writeFileIfNeeded(path.join(packagePath, 'TodoWidgetModule.kt'), moduleContent);
    writeFileIfNeeded(path.join(resPath, 'layout', 'widget_todo.xml'), layoutContent);
    writeFileIfNeeded(path.join(resPath, 'drawable', 'widget_background.xml'), backgroundDrawable);
    writeFileIfNeeded(path.join(resPath, 'xml', 'todo_widget_info.xml'), widgetInfoContent);

    return config;
  }]);

  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const app = manifest.application?.[0];
    if (!app) {
      return config;
    }

    if (!app.receiver) {
      app.receiver = [];
    }

    const existing = app.receiver.find(
      (item) => item.$['android:name'] === WIDGET_PROVIDER_CLASS
    );

    if (!existing) {
      app.receiver.push({
        $: {
          'android:name': WIDGET_PROVIDER_CLASS,
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/todo_widget_info',
            },
          },
        ],
      });
    }

    return config;
  });

  return config;
};
