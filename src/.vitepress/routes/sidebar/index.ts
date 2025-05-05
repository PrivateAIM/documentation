import {adminRoutes} from "./admin";
import {userRoutes} from "./user";
import {deploymentRoutes} from "./deployment";

export const sidebarRoutes = [
    {
        text: 'Getting Started',
        base: '/getting-started',
        items: [
            {text: 'Introduction', link: '/'},
            {text: 'Architecture', link: '/architecture'},
            {text: 'Components', link: '/components'},
            {text: 'Guides', link: '/guides'},
            {text: 'Glossar', link: '/glossar'},
        ]
    },
    {
        text: 'User',
        base: '/guide/user',
        items: userRoutes
    },
    {
        text: 'Admin',
        base: '/guide/admin',
        items: adminRoutes
    },
    {
        text: 'Deployment',
        base: '/guide/deployment',
        items: deploymentRoutes
    },
]
