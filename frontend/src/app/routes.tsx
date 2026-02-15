import { createBrowserRouter } from "react-router-dom";
import { Welcome } from "./pages/Welcome";
import { Detection } from "./pages/Detection";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Welcome,
  },
  {
    path: "/detection",
    Component: Detection,
  },
]);
