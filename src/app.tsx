import React from 'react';
import './app.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import { HomeComponent } from './components/home/home';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/home/:key1/:key2/:encodeData">
            <HomeComponent></HomeComponent>
          </Route>
          <Route path="/">
            <HomeComponent></HomeComponent>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
