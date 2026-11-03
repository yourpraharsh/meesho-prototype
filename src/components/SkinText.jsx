import { useUiTheme } from '../utils/uiTheme'

/** Copy that differs between the Meesho (Android) and Liquid Glass (iOS) navigation skins. */
export default function SkinText({ ios, android }) {
  const [theme] = useUiTheme()
  return theme === 'ios' ? ios : android
}
