/// <reference path="./../typings/index.d.ts" />

import {registerRoutes as authRoutes} from "./auth/auth-routes";
import {registerRoutes as homeRoutes} from "./home/home-routes"; 
import {registerRoutes as assetRoutes} from "./assets/assets-routes";
import {registerRoutes as setupRoutes} from "./setup/setup-routes";

export const RoutesToRegister = [
    authRoutes,
    homeRoutes,
    assetRoutes,
    setupRoutes,
];