import { spawn } from 'node:child_process'
import { config } from '../config.js'

export function synthesize(text) {
  return new Promise((resolve, reject) => {
    const proc = spawn(config.piperBin, ['--model', config.piperVoice, '--output_file', '-'])

    const stdout = []
    const stderr = []

    proc.stdout.on('data', (chunk) => stdout.push(chunk))
    proc.stderr.on('data', (chunk) => stderr.push(chunk))

    proc.on('error', reject)

    proc.on('close', (code) => {
      const audio = Buffer.concat(stdout)
      if (code !== 0 || audio.length === 0) {
        reject(new Error(`piper exited with code ${code}: ${Buffer.concat(stderr).toString('utf8')}`))
        return
      }
      resolve(audio)
    })

    proc.stdin.write(text)
    proc.stdin.end()
  })
}
