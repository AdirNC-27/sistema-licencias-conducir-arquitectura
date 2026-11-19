/**
 * Reglas de arquitectura (EQ-06): se ejecutan con `npm run arquitectura` y en GitHub Actions.
 * Si alguna se rompe, el pipeline falla.
 */
module.exports = {
  forbidden: [
    {
      name: 'dominio-independiente',
      comment: 'Clean Architecture: el dominio no conoce NestJS, TypeORM, Express ni la infraestructura',
      severity: 'error',
      from: { path: '/dominio/' },
      to: { path: ['node_modules/@nestjs', 'node_modules/typeorm', 'node_modules/express', '/infraestructura/', '/presentacion/', '/aplicacion/'] },
    },
    {
      name: 'aplicacion-sin-infraestructura',
      comment: 'Los casos de uso dependen de contratos del dominio, nunca de implementaciones concretas',
      severity: 'error',
      from: { path: '/aplicacion/' },
      to: { path: ['/infraestructura/', '/presentacion/', 'node_modules/typeorm'] },
    },
    {
      name: 'modulos-solo-por-contratos',
      comment: 'Monolito modular: un módulo solo usa el dominio (contratos/fachada) de otro, no su infraestructura ni sus casos de uso',
      severity: 'error',
      from: { path: '^src/modulos/([^/]+)/' },
      to: {
        path: '^src/modulos/([^/]+)/(infraestructura|aplicacion|presentacion)/',
        pathNot: ['^src/modulos/$1/', '\\.module\\.ts$'],
      },
    },
    {
      name: 'sin-ciclos',
      severity: 'error',
      from: { path: '^src/' },
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['__tests__', 'test-utils', '\\.spec\\.ts$'] },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
