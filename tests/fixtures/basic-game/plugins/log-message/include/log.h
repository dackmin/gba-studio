#ifndef LOG_H
#define LOG_H

#include <bn_log.h>
#include "game.h"
#include <neo_types.h>

namespace log_message
{
  void log(neo::game* game, const neo::types::plugin_event* e);
}

#endif // LOG_H
