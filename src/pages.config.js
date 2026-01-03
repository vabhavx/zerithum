import ConnectedApps from './pages/ConnectedApps';
import ConnectedPlatforms from './pages/ConnectedPlatforms';
import Dashboard from './pages/Dashboard';
import Help from './pages/Help';
import Notifications from './pages/Notifications';
import Platforms from './pages/Platforms';
import Privacy from './pages/Privacy';
import Reconciliation from './pages/Reconciliation';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SettingsAccount from './pages/SettingsAccount';
import SettingsConnectedApps from './pages/SettingsConnectedApps';
import SettingsNotifications from './pages/SettingsNotifications';
import SettingsPrivacy from './pages/SettingsPrivacy';
import SettingsSubscription from './pages/SettingsSubscription';
import Subscription from './pages/Subscription';
import TaxExport from './pages/TaxExport';
import TaxReports from './pages/TaxReports';
import Transactions from './pages/Transactions';
import AuthCallback from './pages/AuthCallback';
import TaxEstimator from './pages/TaxEstimator';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ConnectedApps": ConnectedApps,
    "ConnectedPlatforms": ConnectedPlatforms,
    "Dashboard": Dashboard,
    "Help": Help,
    "Notifications": Notifications,
    "Platforms": Platforms,
    "Privacy": Privacy,
    "Reconciliation": Reconciliation,
    "Reports": Reports,
    "Settings": Settings,
    "SettingsAccount": SettingsAccount,
    "SettingsConnectedApps": SettingsConnectedApps,
    "SettingsNotifications": SettingsNotifications,
    "SettingsPrivacy": SettingsPrivacy,
    "SettingsSubscription": SettingsSubscription,
    "Subscription": Subscription,
    "TaxExport": TaxExport,
    "TaxReports": TaxReports,
    "Transactions": Transactions,
    "AuthCallback": AuthCallback,
    "TaxEstimator": TaxEstimator,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};