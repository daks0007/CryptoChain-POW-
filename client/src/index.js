import React from "react";
import { render } from "react-dom";
import App from "./components/App";
import { Router, Switch, Route } from "react-router-dom";
import history from "./history";
import "./index.css";
import ConductTransaction from "./components/ConductTransation";
import TransactionPool from "./components/TransactionPool";
import Blocks from "./components/Blocks";

render(
  <Router history={history}>
    <Switch>
      <Route exact={true} path="/" component={App} />
      <Route path="/blocks" component={Blocks} />
      <Route path="/conduct-transaction" component={ConductTransaction} />
      <Route path="/transaction-pool" component={TransactionPool} />
    </Switch>
  </Router>,
  document.getElementById("root")
);
