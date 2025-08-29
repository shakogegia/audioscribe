import { SettingsDropdown } from "./settings-dropdown";
import { ThemeSwitcher } from "./theme-switcher";

export function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <div />
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <SettingsDropdown />
      </div>
    </header>
  );
}
