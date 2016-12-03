import React from 'react'
import ButtonPanel from './ButtonPanel'
import ProgressBar from './ProgressBar'
import TimeLabel from './TimeLabel'
import NameLabel from './NameLabel'
import SongFormatterMixin from  './SongFormatterMixin'
import { Howl } from 'howler'

const Player = React.createClass({

  mixins: [SongFormatterMixin],

  getDefaultProps: function () {
    return {podcast: null, intervalDurationMs: 15 * 1000}
  },

  getInitialState: function () {
    return {
      isPlaying: false,
      isPause: false,
      isLoading: false
    }
  },

  componentWillMount: function () {
    if (this.props.podcast) {
      const podcast = this.props.podcast
      this.setState({
        podcast: podcast
      })
    }
  },

  componentDidUpdate: function (prevProps, prevState, prevContext) {
    const lastId = prevProps.podcast.id
    const currentId = this.props.podcast.id
    if (!this.state.isLoading && lastId !== currentId) {
      this.initSoundObject()
      this.setState({
        podcast: this.props.podcast,
        isPlaying: false,
        isPause: false,
        isLoading: false
      })
    }
  },

  render: function () {
    let percent = 0
    if (this.state.seek && this.state.duration) {
      percent = this.state.seek / this.state.duration
    }
    let songName = this.getCurrentSongName()
    return (
      <div className="audio-player">
        <div className="clearfix">
          <ButtonPanel isPlaying={this.state.isPlaying} isPause={this.state.isPause}
                       isLoading={this.state.isLoading}
                       currentSongIndex={this.state.currentSongIndex}
                       onPlayBtnClick={this.onPlayBtnClick} onPauseBtnClick={this.onPauseBtnClick}
                       onPrevBtnClick={this.onPrevBtnClick} onNextBtnClick={this.onNextBtnClick}/>
          <ProgressBar percent={percent} seekTo={this.seekTo}/>
        </div>

        <div className="audio-desc-container clearfix">
          <NameLabel name={songName}/>
          <TimeLabel seek={this.state.seek} duration={this.state.duration}/>
        </div>

      </div>
    )
  },

  onPlayBtnClick: function () {
    if (this.state.isPlaying && !this.state.isPause) {
      return
    }

    this.play()
  },

  onPauseBtnClick: function () {
    let isPause = !this.state.isPause
    this.setState({isPause: isPause})
    isPause ? this.pause() : this._play()
  },

  onPrevBtnClick: function () {
    this.prev()
  },

  onNextBtnClick: function () {
    this.next()
  },

  play: function () {
    this.setState({isPlaying: true, isPause: false})

    if (!this.howler) {
      this.initSoundObject()
    } else {
      let songUrl = this.state.podcast.mp3Url
      if (songUrl != this.howler._src) {
        this.initSoundObject()
      } else {
        this._play()
      }
    }
  },

  initSoundObject: function () {
    this.clearSoundObject()
    this.setState({isLoading: true})

    this.howler = new Howl({
      src: this.state.podcast.mp3Url,
      volume: 1.0,
      onload: this.initSoundObjectCompleted,
      html5: true
    })
  },

  clearSoundObject: function () {
    if (this.howler) {
      this.howler.stop()
      this.howler = null
    }
  },

  initSoundObjectCompleted: function () {
    const lastPos = this.props.podcast.last_position
    this._play()
    this.seekToSeconds(lastPos)
    this.setState({
      duration: this.howler.duration(),
      isLoading: false
    })
  },

  _play: function () {
    this.howler.play()
    this.stopUpdateCurrentDuration()
    this.updateCurrentDuration()
    this.interval = setInterval(this.updateCurrentDuration, this.props.intervalDurationMs)
  },

  stop: function () {
    this.stopUpdateCurrentDuration()
    this.setState({seek: 0, isPlaying: false})
  },

  pause: function () {
    this.howler.pause()
    this.stopUpdateCurrentDuration()
  },

  updateCurrentDuration: function () {
    this.setState({seek: this.howler.seek()})
    this.props.tickCallback(this.state.podcast, this.state.seek)
  },

  stopUpdateCurrentDuration: function () {
    clearInterval(this.interval)
  },

  seekToSeconds: function (s) {
    this.howler.seek(s)
    this.setState({seek: s})
  },

  seekTo: function (percent) {
    let seek = this.state.duration * percent
    this.howler.seek(seek)
    this.setState({seek: seek})
  },

  getCurrentSongName: function () {
    if (this.state.podcast) {
      return this.state.podcast.title
    } else {
      return ""
    }
  }

})

export default Player