import AuthEl from "@/components/auth"
import VerifyAccount from "@/components/auth/verify";
import Avatars from "@/data/pages/avatars";
import Campaigns from "@/data/pages/campaigns";
import Credentials from "@/data/pages/credentials";
import Home from "@/data/pages/home";
import Profile from "@/data/pages/profile"
import Publications from "@/data/pages/publications";
import Settings from "@/data/pages/settings";
import Sources from "@/data/pages/sources";
import Team from "@/data/pages/team";
import Test from "@/data/pages/test";
import {
    CircleGauge, LibraryBig,
    MegaphoneIcon, Newspaper, SettingsIcon,
    SquareUser, Users
} from "lucide-react";

const pagesMap = [
    // AUTH PAGES
    {
        pathname: '/auth/signin',
        Component: (props) => { return <AuthEl type="signin" {...props} /> },
    },
    {
        pathname: '/auth/signup',
        Component: (props) => { return <AuthEl type="signup" {...props} /> },
    },
    {
        pathname: '/auth/reset',
        Component: (props) => { return <AuthEl type="reset" {...props} /> },
    },
    {
        pathname: '/auth/verify',
        Component: (props) => { return <VerifyAccount {...props} /> },
    },
    // MAIN APP PAGES
    {
        pathname: '/',
        Component: (props) => { return <Home {...props} />; },
    },
    {
        pathname: '/profile',
        Component: (props) => { return <Profile {...props} />; },
    },
    {
        pathname: '/settings',
        Component: (props) => { return <Settings {...props} />; },
    },
    {
        pathname: '/not-found',
        Component: (props) => { return <div className="container-main">pagesMap not-found</div> },
    },
    {
        pathname: '/test',
        Component: (props) => { return <Test {...props} />; },
    },
    {
        pathname: '/test/{{ITEM_ID}}',
        Component: (props) => { return <Test {...props} />; },
    },
    {
        pathname: '/sources',
        Component: (props) => { return <Sources {...props} />; },
        // Component: (props) => { return <div>Sources</div> },
    },
    {
        pathname: '/credentials',
        Component: (props) => { return <Credentials {...props} />; },
        // Component: (props) => { return <div>Sources</div> },
    },
    {
        pathname: '/team',
        Component: (props) => { return <Team {...props} />; },
    },
    {
        pathname: '/avatars',
        Component: (props) => { return <Avatars {...props} />; },
        // Component: (props) => { return <div>Sources</div> },
    },
    {
        pathname: '/campaigns',
        Component: (props) => { return <Campaigns {...props} />; },
        // Component: (props) => { return <div>Sources</div> },
    },
    {
        pathname: '/publications',
        Component: (props) => { return <Publications {...props} />; },
        // Component: (props) => { return <div>Sources</div> },
    },
]


export const pagesMapSidebar = [
    {
        name: 'Dashboard',
        icon: (props) => <CircleGauge {...props} />,
        href: '/',
        subItems: []
    },
    {
        name: 'Campaigns',
        icon: (props) => <MegaphoneIcon {...props} />,
        href: '/campaigns',
        subItems: []
    },
    {
        name: 'Content',
        icon: (props) => <Newspaper {...props} />,
        href: '/publications',
        expanded: true,
        // subItems: [
        //     { name: 'sub-test', href: '/test/sub-test', icon: (props) => <StretchHorizontal {...props} /> },
        // ]
    },
    {
        name: 'Avatars',
        icon: (props) => <SquareUser {...props} />,
        href: '/avatars',
        subItems: []
    },
    // {
    //     name: 'Social Media Pages',
    //     icon: (props) => <HashIcon {...props} />,
    //     href: '/social-media-pages',
    //     subItems: []
    // },
    {
        name: 'Sources',
        icon: (props) => <LibraryBig {...props} />,
        href: '/sources',
        subItems: []
    },
    // {
    //     name: 'Credentials',
    //     icon: (props) => <Lock {...props} />,
    //     href: '/credentials',
    //     subItems: []
    // },
    {
        name: 'Team',
        icon: (props) => <Users {...props} />,
        href: '/team',
        subItems: []
    },
    {
        name: 'Settings',
        icon: (props) => <SettingsIcon {...props} />,
        href: '/settings',
        subItems: []
    },
]

export default pagesMap;