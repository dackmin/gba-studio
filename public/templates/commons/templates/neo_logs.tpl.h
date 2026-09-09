#ifndef NEO_LOGS_H
#define NEO_LOGS_H

#ifdef BN_CFG_LOG_ENABLED
#undef BN_CFG_LOG_ENABLED
#endif
#define BN_CFG_LOG_ENABLED {{bool project.settings.logsEnabled}}

#endif
