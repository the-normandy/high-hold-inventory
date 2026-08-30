!define LEGACY_PRODUCT_NAME "High Hold Storehouse"
!define LEGACY_UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${LEGACY_PRODUCT_NAME}"

Var LegacyProductMigrated
Var LegacyDesktopShortcut

!macro NSIS_HOOK_PREINSTALL
  StrCpy $LegacyProductMigrated 0
  StrCpy $LegacyDesktopShortcut 0
  SetShellVarContext current
  ReadRegStr $R0 HKCU "${LEGACY_UNINSTALL_KEY}" "UninstallString"

  ${If} $R0 != ""
    StrCpy $LegacyProductMigrated 1
    IfFileExists "$DESKTOP\${LEGACY_PRODUCT_NAME}.lnk" 0 +2
      StrCpy $LegacyDesktopShortcut 1

    ExecWait '$R0 /S' $R1
    ${If} $R1 <> 0
      MessageBox MB_ICONSTOP|MB_OK "Storehouse could not remove the previous High Hold Storehouse installation (error $R1). The installation will stop to avoid creating duplicate entries."
      Quit
    ${EndIf}

    Delete "$SMPROGRAMS\${LEGACY_PRODUCT_NAME}.lnk"
    Delete "$DESKTOP\${LEGACY_PRODUCT_NAME}.lnk"
    DeleteRegKey HKCU "${LEGACY_UNINSTALL_KEY}"
    DeleteRegKey HKCU "Software\high-hold\${LEGACY_PRODUCT_NAME}"
    DeleteRegKey /ifempty HKCU "Software\high-hold"
  ${EndIf}
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ${If} $LegacyProductMigrated = 1
    CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
    !insertmacro SetLnkAppUserModelId "$SMPROGRAMS\${PRODUCTNAME}.lnk"

    ${If} $LegacyDesktopShortcut = 1
      CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
      !insertmacro SetLnkAppUserModelId "$DESKTOP\${PRODUCTNAME}.lnk"
    ${EndIf}
  ${EndIf}
!macroend