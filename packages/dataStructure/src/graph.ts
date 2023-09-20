import PriorityQueue from './priorityQueue.js'
import unionFind from './unionFind.js'

class Node<T = any> {
    private isDirected: boolean
    private in: number // 入度，表示在有向图中，指向节点的边数量
    private out: number // 入度，表示在有向图中，从节点出发的边数量
    private value: T
    readonly nexts: Set<Node<T>> = new Set() // 相邻的点的集合
    readonly edges: Set<Edge<T>> = new Set() // 相邻边的集合

    constructor(value?: T, isDirected: boolean = false) {
        // isDirected 是否是有向图
        this.value = value
        if (isDirected) {
            this.isDirected = true
            this.in = 0
            this.out = 0
        } else {
            delete this.in
            delete this.out
            delete this.isDirected
        }
    }

    addEdge(edge: Edge<T>) {
        this.edges.add(edge)
        this.nexts.add(edge.from !== this ? edge.from : edge.to)
        this.isDirected && (edge.from !== this ? this.in++ : this.out++)
    }
}

class Edge<T = any> {
    readonly weight: number //权重
    readonly from: Node<T>
    readonly to: Node<T>

    constructor(from: Node<T>, to: Node<T>, weight?: number) {
        this.weight = weight
        this.from = from
        this.to = to
    }
}

const dijkstra = <T>(start: Node<T>, distanceMap: Map<Node<T>, number>) => {
    let priorityQueue: PriorityQueue<{ node: Node<T>, distance: number }>
    let priorityQueueNodeMap: Map<Node<T>, { node: Node<T>, distance: number }>

    const getMinDistance = (distanceMap: Map<Node<T>, number>) => {
        if (!priorityQueue) {
            initPriorityQueue(distanceMap)
        }
        if (priorityQueue.isEmpty()) return
        const {node: minNode, distance} = priorityQueue.offer()
        for (let edge of minNode.edges) {
            const node = edge.from === minNode ? edge.to : edge.from
            if (priorityQueueNodeMap.has(node)) {
                const queueItem = priorityQueueNodeMap.get(node)
                queueItem.distance = Math.min(distanceMap.get(node), edge.weight + distance)
                distanceMap.set(node, queueItem.distance)
                priorityQueue.update(queueItem)
            }
        }
        priorityQueueNodeMap.delete(minNode)
        return minNode
    }

    const initPriorityQueue = (distanceMap: Map<Node<T>, number>) => {
        priorityQueue = new PriorityQueue((a: any, b: any) => a.distance - b.distance)
        const dataList = []
        const nodeMap = new Map()
        for (let [node, distance] of distanceMap.entries()) {
            const data = {node, distance}
            dataList.push(data)
            nodeMap.set(node, data)
        }
        priorityQueue.init(dataList)
        priorityQueueNodeMap = nodeMap
    }

    let min = start
    while (min) {
        min = getMinDistance(distanceMap)
    }
    return distanceMap
}

const kruskal = <T>(edges: Edge<T>[], nodes: Node<T>[]) => {
    const sortEdges = edges.sort((a, b) => a.weight - b.weight)
    const uf = new unionFind(nodes)
    const result: Edge<T>[] = []
    while (sortEdges.length) {
        const minEdge = sortEdges.shift()
        if (!uf.isSameSet(minEdge.from, minEdge.to)) {
            result.push(minEdge)
            uf.union(minEdge.from, minEdge.to)
        }
    }
    return result
}

const getMaxDepth = <T>(node: Node<T>, dp: Map<Node<T>, number>) => {
    if (dp.has(node)) return dp.get(node)
    let result = []
    for (let {from, to} of node.edges) {
        if (from === node) result.push(getMaxDepth(to, dp))
    }
    const depth = result.length ? Math.max(...result) + 1 : 1
    dp.set(node, depth)
    return depth
}

type DATA<T> = [from: T, to: T, weight?: number]

class Graph<T = any> {
    constructor(private readonly isDirected: boolean) {
        this.isDirected = isDirected
    }

    nodes: Map<T, Node<T>> = new Map()
    edges: Set<Edge<T>> = new Set()

    init(dataList: DATA<T>[]) {
        dataList.forEach(data => {
            const [fromVal, toVal, weight] = data
            const hasFrom = this.nodes.has(fromVal)
            const hasTo = this.nodes.has(toVal)
            const nodeFrom = hasFrom ? this.nodes.get(fromVal) : new Node<T>(fromVal, this.isDirected)
            const nodeTo = hasTo ? this.nodes.get(toVal) : new Node<T>(toVal, this.isDirected)
            const edge = new Edge<T>(nodeFrom, nodeTo, weight)
            nodeFrom.addEdge(edge)
            nodeTo.addEdge(edge)
            !hasFrom && this.nodes.set(fromVal, nodeFrom)
            !hasTo && this.nodes.set(toVal, nodeTo)
            this.edges.add(edge)
        })
    }

    iterator(fn: (node: Node<T>) => any, type?: 'depth' | 'width', startNodeVal?: T) {
        if (!this.nodes.size) {
            return
        }
        type = type || 'depth'
        const start = this.getStartNode(startNodeVal)
        return type === 'depth' ? this.depthIterator(start, fn) : this.widthIterator(start, fn)
    }

    // 基于狄力克斯拉算法 求集合各个点到某个起点的最短路径
    getMinPathMap(startNodeVal?: T) {
        if (!this.nodes.size) {
            return
        }
        const start = this.getStartNode(startNodeVal)
        const distanceMap: Map<Node<T>, number> = new Map()
        for (let node of this.nodes.values()) {
            distanceMap.set(node, Number.MAX_VALUE)
        }
        distanceMap.set(start, 0)
        return dijkstra<T>(start, distanceMap)
    }

    // 最小生成树
    getMinSpanningTree() {
        return kruskal([...this.edges], [...this.nodes.values()])
    }

    // 拓扑序
    topologySort() {
        const nodes = [...this.nodes.values()]
        const dp = new Map()
        for (let index = 0; index < nodes.length; index++) {
            const node = nodes[index]
            dp.set(node, getMaxDepth(node, dp))
        }
        return dp
    }

    private getStartNode = (startNodeVal: T) => startNodeVal && this.nodes.has(startNodeVal) ? this.nodes.get(startNodeVal) : [...this.nodes.values()][0]

    private depthIterator(start: Node<T>, fn: (node: Node<T>) => void) {
        const stack: Node<T>[] = [start]
        const result: Node<T>[] = [start]
        fn(start)
        while (stack.length) {
            const curNode = stack.pop()
            for (let node of curNode.nexts.values()) {
                if (!result.includes(node)) {
                    stack.push(curNode)
                    stack.push(node)
                    fn(node)
                    result.push(node)
                    break
                }
            }
        }
        return result
    }

    private widthIterator(start: Node<T>, fn: (node: Node<T>) => void) {
        const queue: Node<T>[] = [start]
        const result: Node<T>[] = [start]
        while (queue.length) {
            const curNode = queue.shift()
            fn(curNode)
            for (let node of curNode.nexts.values()) {
                if (!result.includes(node)) {
                    queue.push(node)
                    result.push(node)
                }
            }
        }
        return result
    }
}

export default Graph
