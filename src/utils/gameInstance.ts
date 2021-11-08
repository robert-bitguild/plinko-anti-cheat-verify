import Matter, { Bodies, Render, Runner } from 'matter-js';
import { random0To1Double } from '../utils/randomHelper';

export interface FrameState {
  s: number[][];
  // collisoins
  c: { x: number; y: number; }[] | undefined;
}

export interface RunGameResult {
  frameStates: FrameState[];
  result: { [basketIndex: number]: number };
}

export class GameInstance {
  static pegStartX = 307;
  static xDistance = 68;

  // number数组元素
  // 0: position.x
  // 1: position.y
  // 2: angle
  public frameStates: FrameState[] = [];
  public collectCollisionPostions: { x: number, y: number }[] = [];

  // 球数组
  private balls: Matter.Body[] = [];
  // 钉子碰撞点数组
  private pegPoints: Matter.Body[] = [];
  // 钉子碰撞点数组
  private line: Matter.Body[] = [];
  // 球数组
  private borders: Matter.Body[] = [];

  // 钉子行数
  private pegsRow = 8;
  private pegStartY = 202;
  private yDistance = 66;
  private pegRadius = 1;
  private basketYDistance = 60;
  private basketHeight = 60;
  private ballRadius = 22;
  // 指球距离canvas顶部的距离
  private fallYDistance = 80;
  private gravityScale = 2.10;
  private ballFrictionAir = 0.1;
  private ballRestitution = 0.97;

  // 局部变量
  // 帧的index
  private frameIndex = 0;
  // 球全部掉入basket里的帧的index， -1表示还没有结束
  private ballFallIntoBasketFrameIndex = -1;
  private basketY: number = 0; // 篮子顶部的y位置
  private farLeftBasketX: number = 0; // 篮子x位置(最左边的竖杠)的positionX
  // 要下球的数量
  private playBallCount = 0;
  // 下球的X坐标(事先生成的)
  private playBallCoordinateXs: number[] = [];
  private engine?: Matter.Engine;
  private fallBacketResult: { [basketIndex: number]: number } = {};
  private fallBacketResult2: number[] = [];
  private runnerIntervalHandler: any = null;

  initGame() {
    // module aliases
    const Engine = Matter.Engine;
    const Composite = Matter.Composite;
    // create an engine
    this.engine = Engine.create();
    this.engine.gravity.scale = this.engine.gravity.scale * this.gravityScale;
    this.renderPegs();
    Composite.add(this.engine.world, [...this.pegPoints, ...this.borders, ...this.line]);

    Matter.Events.on(this.engine, "beforeUpdate", this.beforeUpdate);
    Matter.Events.on(this.engine, "collisionStart", this.collisionStart);
  }

  runGame = (ballCount: number, ballCoordinateXs: number[], element?: HTMLElement | undefined): RunGameResult => {
    this.fallBacketResult = {};
    this.playBallCount = ballCount;
    this.playBallCoordinateXs = ballCoordinateXs;

    // create renderer
    const render = Render.create({
      element,
      engine: this.engine!,
      options: {
        width: 750,
        height: 760,
      }
    });

    Render.run(render);
    let determineWidth = document.documentElement.clientWidth;
    if (determineWidth > 400) {
      determineWidth = 400;
    }
    render.canvas.width = determineWidth;
    render.canvas.height = determineWidth * 760 / 750;
    const ctx: any = render.canvas.getContext("2d");
    ctx.scale(render.canvas.width / 750, render.canvas.height / 760);

    this.runnerIntervalHandler = setInterval(() => {
      Matter.Engine.update(this.engine!, 1000 / 60);
    }, 1000 / 60);

    return {
      frameStates: this.frameStates,
      result: this.fallBacketResult
    };
  }

  closeGame = () => {
    clearInterval(this.runnerIntervalHandler);
  }

  clearBalls = () => {
    for (const ball of this.balls) {
      Matter.World.remove(this.engine!.world, ball);
    }
    this.balls = [];
    this.playBallCount = 0;
  }

  checkFallInBasket = () => {
    let ballAllFallIntoBasket = true;
    let ballFallTrigger = false;
    for (const ball of this.balls) {
      const ballX = ball.position.x;
      const ballY = ball.position.y;
      const ballAny = ball as any;
      if (!ballAny.stated) {
        if (ballY >= this.basketY + 60) {
          ballAny.stated = true;
          const baskedHitedIndex = Math.ceil((ballX - this.farLeftBasketX) / GameInstance.xDistance) - 1; // 篮子index从0开始
          ballFallTrigger = true;
          // console.log('ball 落进篮子 ' + baskedHitedIndex);
          this.fallBacketResult[baskedHitedIndex] = (this.fallBacketResult[baskedHitedIndex] || 0) + 1;
          this.fallBacketResult2.push(baskedHitedIndex);
        }
      }

      if (!ballAny.stated) {
        ballAllFallIntoBasket = false;
      }
    }

    if (ballFallTrigger && this.balls.length > 0 && ballAllFallIntoBasket) {
      this.ballFallIntoBasketFrameIndex = this.frameIndex;
      // console.log('ball 所有都进篮子了');
    }
  }

  renderPegs = () => {
    let x = GameInstance.pegStartX;
    let y = this.pegStartY;
    let curRow = 1;
    let instance = 0;
    const wallHeight = 550;
    const wallWidth = 10;
    const pegsAmount = this.pegsRow * (5 + this.pegsRow) / 2;
    for (let i = 1; i <= pegsAmount; i++) {
      // 取中间高度值做两边挡板中心点
      const middleRow = Math.ceil(this.pegsRow / 2);
      if (i === (middleRow * (5 + middleRow) / 2)) {
        this.borders.push(Bodies.rectangle(x + instance + 40, y + 6 + (this.yDistance / 2), wallWidth, wallHeight, {
          isStatic: true,
          angle: -Math.PI * 0.15,
        }));
      }
      if (i === (((middleRow - 1) * (5 + middleRow - 1) / 2) + 1)) {
        this.borders.push(Bodies.rectangle(
          x - (GameInstance.xDistance / 2) - 40,
          y + 6 + (this.yDistance / 2 + this.yDistance),
          wallWidth,
          wallHeight,
          {
            isStatic: true,
            angle: Math.PI * 0.15,
          }));
      }
      if (i <= (curRow * (5 + curRow) / 2)) {
        const peg = Bodies.circle(x + instance, y + 6, this.pegRadius, {
          label: 'peg',
          isStatic: true,
        });
        if (curRow === this.pegsRow) {
          const vLine = Bodies.rectangle(x + instance, y + this.basketYDistance, 3, this.basketHeight, {
            isStatic: true,
          });
          // const hLine = Bodies.rectangle(
          //   x + instance - (GameInstance.xDistance / 2),
          //   y + this.basketYDistance + (this.basketHeight / 2) + 10,
          //   GameInstance.xDistance,
          //   20,
          //   {
          //     isStatic: true,
          //   });
          this.line.push(vLine);
        }
        this.pegPoints.push(peg);
        instance += GameInstance.xDistance;
      } else {
        instance = GameInstance.xDistance;
        curRow += 1;
        x -= (GameInstance.xDistance / 2);
        y += this.yDistance;

        const peg = Bodies.circle(x, y + 6, 1, {
          label: 'peg',
          isStatic: true,
        });
        if (curRow === this.pegsRow) {
          this.farLeftBasketX = x;
          this.basketY = y;
          const vLine = Bodies.rectangle(x, y + this.basketYDistance, 3, this.basketHeight, {
            isStatic: true,
          });
          this.line.push(vLine);
        }
        this.pegPoints.push(peg);
      }
    }
  }

  addClientBallsInStep = (stepIndex: number) => {
    if (stepIndex > 20 && this.balls.length < this.playBallCount) {
      // 2步加一个球
      if (stepIndex % 2 === 0) {
        const positionX = this.playBallCoordinateXs[this.balls.length];
        const ball = Bodies.circle(positionX, this.fallYDistance, this.ballRadius, {
          label: 'ball',
          collisionFilter: {
            group: -1
          },
          frictionAir: this.ballFrictionAir,
          restitution: this.ballRestitution,
          density: 1,
        });

        Matter.Body.scale(ball, 0.8, 0.8);
        Matter.Composite.add(this.engine!.world, ball);
        this.balls.push(ball);
      }
    }
  }
  private beforeUpdate = (event: Matter.IEventTimestamped<Matter.Engine>) => {
    this.frameIndex++;
    this.addClientBallsInStep(this.frameIndex);
    this.checkFallInBasket();

    const frameState: FrameState = {
      s: [],
      c: this.collectCollisionPostions.length === 0 ? undefined : this.collectCollisionPostions
    };
    for (const ball of this.balls) {
      frameState.s.push(this.collectBallState(ball));
    }
    this.frameStates.push(frameState);

    // 清除掉Collission的记录，以便下次发生时收集
    this.collectCollisionPostions = [];
  }

  private collisionStart = (event: Matter.IEventCollision<Matter.Engine>) => {
    const pairs = event.pairs;
    for (const pair of pairs) {
      if (pair.bodyA.label === "ball" && pair.bodyB.label === "peg") {
        this.collectCollisionPostions.push({
          x: pair.bodyB.position.x,
          y: pair.bodyB.position.y,
        });
      } else if (pair.bodyB.label === "ball" && pair.bodyA.label === "peg") {
        this.collectCollisionPostions.push({
          x: pair.bodyA.position.x,
          y: pair.bodyA.position.y,
        });
      }
    }
  }

  private numberPrecision = (num: number): number => {
    return Math.round(num * 100) / 100.0;
  }
  private collectBallState = (ball: Matter.Body): number[] => {
    // 如果是snapshot, 则只返回3个
    return [
      this.numberPrecision(ball.position.x),
      this.numberPrecision(ball.position.y),
      this.numberPrecision(ball.angle),
    ];
  }
}

export function generate25BallCooridateX(): number[] {
  const result = [];
  for (let i = 0; i < 25; i++) {
    const doublePosition = random0To1Double() * (GameInstance.xDistance * 2 - 20) + GameInstance.pegStartX + 10;
    const positionX = Math.floor(doublePosition * 10000) / 10000.0;
    result.push(positionX);
  }
  return result;
}

export function addSeed(seed: number, posXs: number[]): number[] {
  const startX = GameInstance.pegStartX + 10;
  const endX = GameInstance.pegStartX + GameInstance.xDistance * 2 - 20;
  if (seed) {
    const absSeed = Math.abs(seed);
    const bit = absSeed.toFixed().length;
    let seedVal = absSeed;
    if (bit > 3) {
      seedVal = Math.abs(seed) / Math.pow(10, bit - 2);
    }
    return posXs.map(posX => {
      const seedAddition = posX + seedVal;
      let newPosx = posX + seedAddition;
      while (newPosx > endX) {
        newPosx = startX + (newPosx - endX);
      }
      return Math.floor(newPosx * 10000) / 10000.0;
    });
  } else {
    return posXs;
  }
}
