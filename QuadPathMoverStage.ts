const w : number = window.innerWidth, h : number = window.innerHeight
const nodes : number = 5
class QuadPathMoverStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    linkedQP : LinkedQP = new LinkedQP()
    animator : Animator = new Animator()
    constructor() {
        this.initCanvas()
        this.render()
        this.handleTap()
    }

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = '#263238'
        this.context.fillRect(0, 0, w, h)
        this.linkedQP.draw(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.linkedQP.startUpdating(() => {
                this.animator.start(() => {
                    this.render()
                    this.linkedQP.update(() => {
                        this.animator.stop()
                    })
                })
            })
        }
    }

    static init() {
        const stage : QuadPathMoverStage = new QuadPathMoverStage()
    }
}

class State {
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += this.dir * 0.1
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class QPNode {
    prev : QPNode
    next : QPNode
    state : State = new State()
    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new QPNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        context.strokeStyle = '#1976D2'
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / 60
        const gap : number = (0.9 * w) / (nodes)
        const index : number = this.i % 2
        const factor : number = 1 - 2 * index
        const sc1 : number = Math.min(0.5, this.state.scale) * 2
        const sc2 : number = Math.min(0.5, Math.max(0, this.state.scale - 0.5)) * 2
        context.save()
        context.translate(0.05 * w + this.i * gap + gap / 2, h/2 - gap / 2)
        context.scale(1, factor)
        if (sc1 != 0) {
            context.beginPath()
            context.moveTo(-gap/2, gap/2)
            context.lineTo(-gap/2 + gap/2 * sc1, gap/2 - gap * sc1)
            context.stroke()
        }
        if (sc2 != 0) {
            context.beginPath()
            context.moveTo(0, -gap/2)
            context.lineTo(gap/2 * sc2, -gap/2)
            context.stroke()
        }
        context.fillStyle = 'white'
        context.beginPath()
        context.arc(-gap/2 + gap/2 * sc1 + gap/2 * sc2, gap/2 - gap * sc1, gap/15, 0, 2 * Math.PI)
        context.fill()
        context.restore()
        if (this.prev) {
            this.prev.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : QPNode {
        var curr : QPNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class LinkedQP {
    curr : QPNode = new QPNode(0)
    dir : number = 1
    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }
}
