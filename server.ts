import { boot } from "@/server"
import express from "express"
import next from "next"
import { parse } from "url"

const port = parseInt(process.env.PORT || "3000", 10)
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const server = express()
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // boot the server
  boot(server)

  // handle the nextjs requests
  server.use((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // start the server
  server.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port} as ${dev ? "development" : process.env.NODE_ENV}`)
  })
})
