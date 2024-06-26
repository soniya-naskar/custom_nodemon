#!/usr/bin/env node

const { spawn } = require("child_process");
const chokidar = require('chokidar');
const path = require("path");


let nodeProcess = null;
let processExited = true
let pathsToWatch = [
    path.join(process.cwd(), "/**/*.js")
    // path.join(process.cwd(), "/**/*.json")
]
let previousReloadTimer = null;

if (process.argv.length === 3) {
    init()
}



function init() {
    nodeProcess = startProcess()
    watchFiles()
    process.on('SIGINT', async () => { await exitHandler() })
    process.on('SIGTERM', async () => { await exitHandler() })
    process.stdin.on('data', async (chunk) => {
        const data = chunk.toString()
        if (data.includes('rs')) {
            await reload()
        }
    })
}

function startProcess() {
    let childProcess = spawn('node', [process.argv[2]], {
        stdio: [process.stdin, process.stdout, process.stderr]
    })

    processExited = false

    childProcess.on('close', () => {
        processExited = true
        console.log('Child Process CLosed')
    })

    childProcess.on('error', () => {
        processExited = true
        console.log('Error occured')
    })

    return childProcess
}

function watchFiles() {
    chokidar
        .watch(pathsToWatch, {
            ignored: "**/node_modules/*",
            ignoreInitial: true
        })
        .on('all', async () => {
            let debouncedTimer = setTimeout(async () => {
                clearTimeout(previousReloadTimer)
                await reload()
            }, 1000)
            previousReloadTimer = debouncedTimer
        })
}

async function reload() {
    await stopProcess();
    nodeProcess = startProcess()
}

async function stopProcess() {
    return new Promise((resolve, reject) => {
        nodeProcess.kill()
        const key = setInterval(() => {
            if (processExited) { }
            clearInterval(key)
            resolve(true)
        }, 500)
    })
}

async function exitHandler() {
    await stopProcess()
    process.exit()
}