import ConnectedPlatforms from './pages/ConnectedPlatforms';
import Dashboard from './pages/Dashboard';
import Reconciliation from './pages/Reconciliation';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TaxReports from './pages/TaxReports';
import SettingsSubscription from './pages/SettingsSubscription';
import SettingsConnectedApps from './pages/SettingsConnectedApps';
import Transactions from './pages/Transactions';
import TaxExport from './pages/TaxExport';
import Help from './pages/Help';
import SettingsAccount from './pages/SettingsAccount';
import SettingsPrivacy from './pages/SettingsPrivacy';
import SettingsNotifications from './pages/SettingsNotifications';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ConnectedPlatforms": ConnectedPlatforms,
    "Dashboard": Dashboard,
    "Reconciliation": Reconciliation,
    "Reports": Reports,
    "Settings": Settings,
    "TaxReports": TaxReports,
    "SettingsSubscription": SettingsSubscription,
    "SettingsConnectedApps": SettingsConnectedApps,
    "Transactions": Transactions,
    "TaxExport": TaxExport,
    "Help": Help,
    "SettingsAccount": SettingsAccount,
    "SettingsPrivacy": SettingsPrivacy,
    "SettingsNotifications": SettingsNotifications,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};