# Config

当前服务使用 `@nestjs/config` 直接读取环境变量。配置项见 `apps/admin-api/.env.example`。

当配置变多时，可以在这里拆分 `database.config.ts`、`redis.config.ts`、`jwt.config.ts` 等文件，并通过 `ConfigModule.forRoot({ load: [...] })` 加载。
