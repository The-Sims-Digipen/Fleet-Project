import { createRoot } from "react-dom/client";

import { Button } from "../../../src/index";
import "./app.css";
import "../../../src/theme.css";

createRoot(document.getElementById("root")!).render(<Button>Continue</Button>);
