---
name: Android 13+ React Native Support
overview: The React Native app already has a full Android project and targets SDK 35; to support Android and be Android 13.0–compatible and forward, you need to add required permissions (including Android 13+ notification and media), wire up Firebase and optionally Maps for Android, and optionally request runtime notification permission. No change to minSdk/targetSdk is required unless you want to restrict to Android 13+ only.
todos: []
isProject: false
---

# Android support and Android 13+ compatibility

## Current state

- **Android project exists** under [reactnative/android/](reactnative/android/) with Gradle 8.12, **compileSdk/targetSdk 35**, **minSdk 24** (Android 7.0+). So the app is already configured above Android 13 (API 33).
- **Manifest** ([reactnative/android/app/src/main/AndroidManifest.xml](reactnative/android/app/src/main/AndroidManifest.xml)) declares only `INTERNET`.
- **Firebase**: iOS has `GoogleService-Info.plist`; Android has **no** `google-services.json` and the **Google Services plugin is not applied** in the Android build, so FCM and Firebase will not work on Android until this is done.
- **Push notifications** are used via [reactnative/app/hooks/usePushNotifications.ts](reactnative/app/hooks/usePushNotifications.ts) (Firebase Messaging). On Android 13+ (API 33+), showing notifications requires the **runtime permission** `POST_NOTIFICATIONS` and it must be declared in the manifest.
- **Location** is used in [reactnative/app/components/common/LocationAutocomplete.tsx](reactnative/app/components/common/LocationAutocomplete.tsx) with `PermissionsAndroid` for `ACCESS_FINE_LOCATION`; the manifest does **not** declare location permissions.
- **Image/camera** is used (e.g. [reactnative/app/screens/UploadScreen.tsx](reactnative/app/screens/UploadScreen.tsx), [reactnative/app/screens/ClientUploadScreen.tsx](reactnative/app/screens/ClientUploadScreen.tsx)) via `react-native-image-crop-picker`; the manifest does **not** declare `CAMERA` or storage/media permissions.
- **Badge**: [reactnative/app/contexts/UnreadCountContext.tsx](reactnative/app/contexts/UnreadCountContext.tsx) syncs unread count to the app icon on **iOS only** via `BadgeModule`. No Android equivalent; optional to add later.
- **react-native-maps** is a dependency; no `MapView` usage was found in the app. If you add map UI on Android later, you will need a Google Maps API key in the Android manifest.

---

## What to do

### 1. Keep or adjust SDK versions

- **No change required** for “Android 13.0 compatible and forward”: **targetSdk 35** already satisfies Play Store and Android 13+ compatibility.
- **Optional**: To support **only** Android 13+ (API 33+), set `minSdkVersion` to **33** in [reactnative/android/build.gradle](reactnative/android/build.gradle) (drops support for older devices).

### 2. Declare and handle Android 13+ permissions

Add the following to [reactnative/android/app/src/main/AndroidManifest.xml](reactnative/android/app/src/main/AndroidManifest.xml) (and use `android:maxSdkVersion` where you want to limit a permission to older APIs):

- **Notifications (Android 13+)**  
  - `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />`  
  - Required for Firebase Cloud Messaging to show notifications on API 33+.
- **Location** (for LocationAutocomplete / geolocation):  
  - `ACCESS_FINE_LOCATION`  
  - Optionally `ACCESS_COARSE_LOCATION`.
- **Camera / media** (for `react-native-image-crop-picker`):  
  - `CAMERA`  
  - For Android 13+ (API 33+): `READ_MEDIA_IMAGES` (and `READ_MEDIA_VIDEO` if you allow video).  
  - For older: `READ_EXTERNAL_STORAGE` (and optionally `WRITE_EXTERNAL_STORAGE` if needed), with `android:maxSdkVersion="32"` if you use scoped storage on 33+.

**Runtime permission for notifications (Android 13+):**  
Before relying on FCM to show notifications, request `POST_NOTIFICATIONS` on API 33+. In [reactnative/app/hooks/usePushNotifications.ts](reactnative/app/hooks/usePushNotifications.ts) (or a shared permission helper), add an Android branch that uses `PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)` when `Platform.OS === 'android'` and `Build.VERSION.SDK_INT >= 33`, then call `messaging().requestPermission()` / `getToken()` as you do now. The hook already runs when the user is authenticated; you can request notification permission at that point or on first app launch.

### 3. Firebase for Android

- In the [Firebase Console](https://console.firebase.google.com) for project **inkedin-5035e**, add an **Android app** with package name `com.inkedinapp` (from [reactnative/android/app/build.gradle](reactnative/android/app/build.gradle)).
- Download **google-services.json** and place it in `reactnative/android/app/`.
- In [reactnative/android/build.gradle](reactnative/android/build.gradle) (buildscript depegit statndencies), add the Google Services classpath, e.g.  
`classpath("com.google.gms:google-services:4.x.x")`
- In [reactnative/android/app/build.gradle](reactnative/android/app/build.gradle), at the bottom, add:  
`apply plugin: 'com.google.gms.google-services'`
- Sync Gradle and confirm the app builds. After this, FCM (and `usePushNotifications`) can work on Android.

### 4. Google Maps (only if you use MapView on Android)

- If you later use `react-native-maps` (e.g. `MapView`) on Android, add a **Google Maps API key** restricted to the Android app (package name + SHA-1).
- In the main `<application>` block of [reactnative/android/app/src/main/AndroidManifest.xml](reactnative/android/app/src/main/AndroidManifest.xml), add:  
`<meta-data android:name="com.google.android.geo.API_KEY" android:value="YOUR_ANDROID_MAPS_KEY"/>`  
(or use a placeholder from `react-native-config` if you already use it for keys.)

### 5. Optional: app icon badge on Android

- Unread badge is iOS-only. For parity, you could add an Android implementation (e.g. ShortcutBadger or a small native module) and call it from [reactnative/app/contexts/UnreadCountContext.tsx](reactnative/app/contexts/UnreadCountContext.tsx) when `Platform.OS === 'android'`. This is optional and not required for “Android 13 compatible and forward.”

### 6. Testing and release

- Build and run: `cd reactnative && npx react-native run-android` (with an API 33+ emulator or device).
- Verify: push notifications (with POST_NOTIFICATIONS granted), location (search/near me), camera/gallery uploads, and any flows that use Firebase.
- For **release**: replace the debug signing config in [reactnative/android/app/build.gradle](reactnative/android/app/build.gradle) with a production keystore and follow [React Native signed APK docs](https://reactnative.dev/docs/signed-apk-android).

---

## Summary checklist


| Item          | Action                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK           | Keep targetSdk 35; optionally set minSdk 33 for “Android 13+ only”                                                                             |
| Manifest      | Add POST_NOTIFICATIONS, location (FINE/COARSE), CAMERA, READ_MEDIA_IMAGES (and optionally READ_EXTERNAL_STORAGE with maxSdkVersion for pre-13) |
| Runtime       | Request POST_NOTIFICATIONS on Android API 33+ before using FCM (e.g. in usePushNotifications or app startup)                                   |
| Firebase      | Add Android app in Firebase Console, add google-services.json, apply Google Services plugin in both Gradle files                               |
| Maps          | Only if using MapView on Android: add com.google.android.geo.API_KEY meta-data                                                                 |
| Badge         | Optional: implement Android badge and call from UnreadCountContext                                                                             |
| Build/release | Test on Android 13+ device/emulator; configure release keystore for production                                                                 |


No structural or iOS-only blockers were found beyond the optional badge; the main work is permissions, Firebase Android setup, and runtime notification permission for Android 13+.