TARGET       :=  $(or $(TARGET), $(notdir $(CURDIR)))
BUILD        :=  $(or $(BUILD), build)
LIBBUTANO    :=  $(or $(LIBBUTANO), butano/butano)
PYTHON       :=  $(or $(PYTHON), python)
SOURCES      :=  $(or $(SOURCES), src)
INCLUDES     :=  $(or $(INCLUDES), include)
DATA         :=  $(or $(DATA), )
GRAPHICS     :=  $(or $(GRAPHICS), graphics)
AUDIO        :=  $(or $(AUDIO), audio)
AUDIOBACKEND :=  $(or $(AUDIOBACKEND), maxmod)
AUDIOTOOL    :=  $(or $(AUDIOTOOL), mmutil)
DMGAUDIO     :=  $(or $(DMGAUDIO), dmg_audio)
DMGAUDIOBACKEND :=  $(or $(DMGAUDIOBACKEND), default)
ROMTITLE     :=  $(or $(ROMTITLE), GBA Studio 2D Sample Game)
ROMCODE      :=  $(or $(ROMCODE), GBAS)
USERFLAGS    :=  $(or $(USERFLAGS), )
USERCXXFLAGS :=  $(or $(USERCXXFLAGS), )
USERASFLAGS  :=  $(or $(USERASFLAGS), )
USERLDFLAGS  :=  $(or $(USERLDFLAGS), )
USERLIBDIRS  :=  $(or $(USERLIBDIRS), )
USERLIBS     :=  $(or $(USERLIBS), )
DEFAULTLIBS  :=  $(or $(DEFAULTLIBS), )
STACKTRACE   :=  $(or $(STACKTRACE), )
USERBUILD    :=  $(or $(USERBUILD), )
EXTTOOL      :=  $(or $(EXTTOOL), )

ifneq (,$(wildcard ./.env))
  include .env
  export
endif

ifndef LIBBUTANOABS
  export LIBBUTANOABS := $(realpath $(LIBBUTANO))
endif

include $(LIBBUTANOABS)/butano.mak
