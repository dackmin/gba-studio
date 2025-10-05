# Butano GBA Game Example

TARGET       :=  $(notdir $(CURDIR))
BUILD        :=  build
LIBBUTANO    :=  butano/butano
PYTHON       :=  python
YARN         :=  yarn
SOURCES      :=  src
INCLUDES     :=  include
DATA         :=
GRAPHICS     :=  graphics
AUDIO        :=  audio
AUDIOBACKEND :=  maxmod
AUDIOTOOL    :=
DMGAUDIO     :=  dmg_audio
DMGAUDIOBACKEND :=  default
ROMTITLE     :=  GBA Studio 2D Sample Game
ROMCODE      :=  MOFS
USERFLAGS    :=
USERCXXFLAGS :=
USERASFLAGS  :=
USERLDFLAGS  :=
USERLIBDIRS  :=
USERLIBS     :=
DEFAULTLIBS  :=
STACKTRACE   :=
USERBUILD    :=

ifneq (,$(wildcard ./.env))
  include .env
  export
endif

EXTTOOL      := @$(YARN) build

ifndef LIBBUTANOABS
  export LIBBUTANOABS := $(realpath $(LIBBUTANO))
endif

include $(LIBBUTANOABS)/butano.mak
