TARGET       :=  {{target}}
BUILD        :=  build
PYTHON       :=  {{posix pythonPath}}
LIBBUTANOABS :=  {{posix butanoPath}}
SOURCES      :=  {{#each sources}}{{posix this}} {{/each}}
INCLUDES     :=  {{#each includes}}{{posix this}} {{/each}}
DATA         :=  {{#each data}}{{posix this}} {{/each}}
GRAPHICS     :=  {{#each graphics}}{{posix this}} {{/each}}
AUDIO        :=  {{#each audio}}{{posix this}} {{/each}}
DMGAUDIO     :=  {{dmgAudio}}
AUDIOBACKEND :=  {{valuedef audioBackend 'maxmod'}}
AUDIOTOOL    :=  {{valuedef audioTool 'mmutil'}}
DMGAUDIOBACKEND :=  {{valuedef dmgAudioBackend 'default'}}
ROMTITLE     :=  {{uppercase romTitle}}
ROMCODE      :=  {{uppercase romCode}}

ifneq (,$(wildcard ./.env))
  include ./.env
  export
endif

ifndef LIBBUTANOABS
  export LIBBUTANOABS := $(realpath $(LIBBUTANO))
endif

include $(LIBBUTANOABS)/butano.mak
