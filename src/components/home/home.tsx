import React, { ChangeEvent } from "react";
import { withRouter, RouteComponentProps, } from "react-router-dom";
import { aesDecrypt } from "../../utils/encryptUtil";
import { addSeed, GameInstance } from "../../utils/gameInstance";
import styles from './home.module.scss';

interface HomeRouterParam {
  key1?: string;
  key2?: string;
  encodeResult?: string;
}

class HomeComponentInner extends React.PureComponent<RouteComponentProps<HomeRouterParam>> {
  state = {
    key1: '',
    key2: '',
    userSeed: "",
    encodeData: '',
    decodeData: '',
    finalResult: "",
    timestamp: '',
    convertDate: '',
    ballCount: '25'
  };

  private gameRef: any = React.createRef();
  private gameInstance: GameInstance | null = null;

  constructor(props: RouteComponentProps) {
    super(props);
    const params: any = props.match.params;

    if (params) {
      let key1 = "";
      if (params.key1) key1 = decodeURIComponent(params.key1);
      let key2 = "";
      if (params.key2) key2 = decodeURIComponent(params.key2);
      let encodeData = "";
      if (params.encodeData) encodeData = decodeURIComponent(params.encodeData);
      let seed = "";
      if (params.seed) seed = decodeURIComponent(params.seed);
      let ballCount = "10";
      if(params.ballCount) ballCount = params.ballCount;

      this.state = {
        key1,
        key2,
        encodeData,
        userSeed: seed,
        decodeData: '',
        finalResult: '',
        timestamp: '',
        convertDate: '',
        ballCount
      };
    }
  }

  didChanged = (e: ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const propName = e.target.dataset.keyname || "";
    this.setState({
      [propName]: newVal
    });
  }


  didTextAreaChanged = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const propName = e.target.dataset.keyname || "";
    this.setState({
      [propName]: newVal
    });
  }

  verify = () => {
    try {
      const decodeData1 = aesDecrypt(this.state.encodeData, this.state.key2);
      const decodeData2 = aesDecrypt(decodeData1, this.state.key1);
      if (decodeData2) {
        const ballPosXs = decodeData2.split(",").map(item => parseFloat(item));
        const numSeed = Number(this.state.userSeed || "0");
        const newballPoxXs = addSeed(numSeed, ballPosXs);
        this.setState({
          decodeData: decodeData2,
          finalResult: newballPoxXs.toString()
        });
        this.runGame(newballPoxXs);
      } else {
        alert("Decode error");
      }
    } catch (e) {
      alert((e as any).message);
    }
  }

  convertTimestamp = () => {
    if (this.state.timestamp) {
      const newDate = new Date(parseInt(this.state.timestamp));
      this.setState({
        convertDate: newDate.toString()
      });
    }
  }

  runGame = (posXs: number[]) => {
    const ballCount = Number(this.state.ballCount);
    if (ballCount >= 0 && ballCount <= 25) {
      if (this.gameInstance != null) {
        this.gameInstance.closeGame();
        const element: HTMLElement = this.gameRef.current;
        element.innerHTML = "";
      }
      this.gameInstance = new GameInstance();
      this.gameInstance.initGame();
      this.gameInstance.runGame(ballCount, posXs, this.gameRef.current);
    }
  }

  render() {
    return <div>
      <div ref={this.gameRef} />
      <div className={styles.outerContainer}>
        <div className={styles.container}>
          <div className={styles.header}>Verify Plinko anti-cheat data</div>
          <div>Key1</div>
          <div><input type="text" value={this.state.key1} onChange={this.didChanged} data-keyname="key1"></input></div>
          <div>Key2</div>
          <div><input type="text" value={this.state.key2} onChange={this.didChanged} data-keyname="key2"></input></div>
          <div>Encode Data</div>
          <div><textarea value={this.state.encodeData} onChange={this.didTextAreaChanged} data-keyname="encodeData"></textarea></div>
          <div>User Seed</div>
          <div><input type="number" value={this.state.userSeed} onChange={this.didChanged} data-keyname="userSeed"></input></div>
          <div>Ball Count</div>
          <div><input type="number" value={this.state.ballCount} onChange={this.didChanged} data-keyname="ballCount"></input></div>
          <div style={{ textAlign: 'center', padding: 10 }}><button type="button" onClick={this.verify}>Verify Game Result</button></div>


          <div>Raw Result</div>
          <div className={styles.resultStyle}>{this.state.decodeData}</div>
          <div>Final Result(Add Seed)</div>
          <div className={styles.resultStyle}>{this.state.finalResult}</div>
          <div style={{ paddingTop: 20 }}>Verify timestamp</div>
          <div>
            <input style={{ width: 250 }} type="text" value={this.state.timestamp} onChange={this.didChanged} data-keyname="timestamp"></input>
            <button type="button" onClick={this.convertTimestamp}>Convert</button>
          </div>
          <div>{this.state.convertDate && this.state.convertDate.toString()}</div>
          <br />
          <div>Source Code: https://github.com/robert-bitguild/plinko-anti-cheat-verify</div>
        </div>

      </div></div>;
  }
}

export const HomeComponent = withRouter(HomeComponentInner);
