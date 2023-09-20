class TreeNode {
    path: number
    end: number
    next: TreeNode[]

    constructor() {
        this.end = this.path = 0
        this.next = []
    }
}

class PrefixTree {
    root: TreeNode

    constructor(strList: string[]) {
        this.root = new TreeNode()
        strList.forEach(this.add)
    }

    startWith(str: string) {
        const node = this._search(str)
        return node && node.path
    }

    endWith(str: string) {
        const node = this._search(str)
        return node && node.end
    }

    remove(str: string) {
        let node = this._search(str)
        if (!node) return
        let index = 0
        node = this.root
        while (index < str.length) {
            node.path--
            if (!node.path) {
                node.next[this._getPath(str[index])] = null
                return
            }
            node = node.next[this._getPath(str[index])]
            index++
        }
        node.path--
        node.end--
    }

    add(str: string) {
        if (!str) return
        let node = this.root
        let index = 0
        while (index < str.length) {
            node.path++
            const path = this._getPath(str[index])
            !node.next[path] && (node.next[path] = new TreeNode())
            node = node.next[path]
            index++
        }
        node.end++
        node.path++
    }

    private _getPath = (str: string) => str.charCodeAt(0) - 'A'.charCodeAt(0)

    private _search = (str: string) => {
        let index = 0
        let node = this.root
        while (index < str.length) {
            if (!node) return null
            node = node.next[this._getPath(str[index])]
            index++
        }
        return node
    }
}

export default PrefixTree
