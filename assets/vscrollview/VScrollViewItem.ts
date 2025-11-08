const { ccclass } = cc._decorator;

//已尝试使用单独的相机来渲染子项的所有Label,渲染没有问题 ,但是drawcall并没有减少,不知道为什么
export function changeUISortingLayer(sortingNode: cc.Node, sortingLayer: number, sortingOrder?: number) {
  // Creator 2.4.x 无 Sorting2D 组件，改用 zIndex 作为替代。
  // if (sortingOrder !== undefined) {
  // sortingNode.zIndex = sortingOrder;
  // }
}

/**
 * 挂载在每个 item 预制体的根节点上
 * 负责处理点击逻辑，通过回调通知父组件
 */
@ccclass('VScrollViewItem')
export class VScrollViewItem extends cc.Component {
  /** 当前 item 对应的数据索引 */
  public dataIndex: number = -1;

  public useItemClickEffect: boolean = true;

  /** 点击回调（由 VirtualScrollView 注入） */
  public onClickCallback: ((index: number) => void) | null = null;

  private _touchStartNode: cc.Node | null = null;
  private _isCanceled: boolean = false;
  private _startPos: cc.Vec2 = new cc.Vec2();
  private _moveThreshold: number = 40; // 滑动阈值
  private _clickThreshold: number = 10; // 点击阈值

  onEnable() {
    // 一次性注册事件，生命周期内不变
    this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
    this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
    this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
    this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
  }

  protected start(): void {
    // this.onSortLayer();
  }

  onDisable() {
    // 清理事件
    this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
    this.node.off(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
    this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
    this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
  }

  /**
   * 将所有子节点的 Label 组件渲染单独排序在一起,并且item的每个lable组件都独立一个orderNumber,以免交错断合批
   * @param node
   */
  public onSortLayer() {
    let orderNumber = 1;
    const labels = this.node.getComponentsInChildren(cc.Label);
    for (let i = 0; i < labels.length; i++) {
      changeUISortingLayer(labels[i].node, 0, orderNumber);
      orderNumber++;
    }
  }

  /** 关闭渲染分层 */
  public offSortLayer() {
    let orderNumber = 0;
    const labels = this.node.getComponentsInChildren(cc.Label);
    for (let i = 0; i < labels.length; i++) {
      changeUISortingLayer(labels[i].node, 0, orderNumber);
    }
  }

  /** 外部调用：更新数据索引 */
  public setDataIndex(index: number) {
    this.dataIndex = index;
  }

  private _onTouchStart(e: cc.Event.EventTouch) {
    // console.log("_onTouchStart");
    this._touchStartNode = this.node;
    this._isCanceled = false;
    const location = e.getLocation();
    this._startPos.set(location);

    // 缩放反馈（假设第一个子节点是内容容器）
    if (this.useItemClickEffect && this.node.children.length > 0) {
      this.node.setScale(0.95, 0.95);
    }
  }

  private _onTouchMove(e: cc.Event.EventTouch) {
    if (this._isCanceled) return;

    const movePos = e.getLocation();
    const dx = movePos.x - this._startPos.x;
    const dy = movePos.y - this._startPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 超过阈值认为是滑动，取消点击
    if (dist > this._moveThreshold) {
      this._isCanceled = true;
      this._restoreScale();
      this._touchStartNode = null;
    }
  }

  private _onTouchEnd(e: cc.Event.EventTouch) {
    if (this._isCanceled) {
      this._reset();
      return;
    }

    this._restoreScale();

    const endPos = e.getLocation();
    const dx = endPos.x - this._startPos.x;
    const dy = endPos.y - this._startPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 移动距离小于阈值才算点击
    if (dist < this._clickThreshold && this._touchStartNode === this.node) {
      if (this.onClickCallback) {
        this.onClickCallback(this.dataIndex);
      }
    }

    this._reset();
  }

  private _onTouchCancel(e: cc.Event.EventTouch) {
    this._restoreScale();
    this._reset();
  }

  private _restoreScale() {
    if (this.useItemClickEffect && this.node.children.length > 0) {
      this.node.setScale(1.0, 1.0);
    }
  }

  private _reset() {
    this._touchStartNode = null;
    this._isCanceled = false;
  }
}
