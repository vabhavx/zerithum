import AuthCallback from './pages/AuthCallback';
import authcallbackTest from './pages/AuthCallback.test';
import ConnectedApps from './pages/ConnectedApps';
import ConnectedPlatforms from './pages/ConnectedPlatforms';
import connectedplatformsTest from './pages/ConnectedPlatforms.test';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Help from './pages/Help';
import Notifications from './pages/Notifications';
import Platforms from './pages/Platforms';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import Reconciliation from './pages/Reconciliation';
import Reports from './pages/Reports';
import RevenueAutopsy from './pages/RevenueAutopsy';
import Settings from './pages/Settings';
import SettingsAccount from './pages/SettingsAccount';
import SettingsConnectedApps from './pages/SettingsConnectedApps';
import SettingsNotifications from './pages/SettingsNotifications';
import SettingsPrivacy from './pages/SettingsPrivacy';
import SettingsSubscription from './pages/SettingsSubscription';
import Subscription from './pages/Subscription';
import TaxEstimator from './pages/TaxEstimator';
import TaxExport from './pages/TaxExport';
import TaxReports from './pages/TaxReports';
import TransactionAnalysis from './pages/TransactionAnalysis';
import Transactions from './pages/Transactions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AuthCallback": AuthCallback,
    "AuthCallback.test": authcallbackTest,
    "ConnectedApps": ConnectedApps,
    "ConnectedPlatforms": ConnectedPlatforms,
    "ConnectedPlatforms.test": connectedplatformsTest,
    "Dashboard": Dashboard,
    "Expenses": Expenses,
    "Help": Help,
    "Notifications": Notifications,
    "Platforms": Platforms,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "Profile": Profile,
    "Reconciliation": Reconciliation,
    "Reports": Reports,
    "RevenueAutopsy": RevenueAutopsy,
    "Settings": Settings,
    "SettingsAccount": SettingsAccount,
    "SettingsConnectedApps": SettingsConnectedApps,
    "SettingsNotifications": SettingsNotifications,
    "SettingsPrivacy": SettingsPrivacy,
    "SettingsSubscription": SettingsSubscription,
    "Subscription": Subscription,
    "TaxEstimator": TaxEstimator,
    "TaxExport": TaxExport,
    "TaxReports": TaxReports,
    "TransactionAnalysis": TransactionAnalysis,
    "Transactions": Transactions,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};