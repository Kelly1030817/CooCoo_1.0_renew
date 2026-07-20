import { app } from './app'

if (import.meta.main) {
  app.listen(Number(Bun.env.PORT || 3000))
  console.log(`CooCoo API listening at ${app.server?.url}`)
}

export { app }
