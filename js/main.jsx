require("./../sass/app.scss")

import React from 'react'
import { Router, Route, IndexRoute, Link } from 'react-router'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import { Navbar, Button, Grid, Row, Col, Image, Nav, NavItem, Glyphicon } from 'react-bootstrap'
import Player from './player/AudioPlayer'
import moment from 'moment'

const INITIAL_ITEM_COUNT = 15
const UPDATE_POSITION_INTERVAL = 15

const App = React.createClass({
  getInitialState() {
    return {
      currentItem: null,
      lastPositionUpdate: 0
    }
  },

  handlePodcastSelected(item) {
    this.setState({currentItem: item})
  },

  handleTick(item, time) {
    const now = moment()
    const nextUpdate = moment(this.state.lastPositionUpdate).add(moment(UPDATE_POSITION_INTERVAL, 'seconds'))

    if (now.isBefore(nextUpdate)) {
      return
    }

    const t = Math.round(time)
    $.ajax({
      url: `/api/update_position/${item.id}/${t}`,
      method: 'POST',
      success: response => {
        if (response === 'OK') {
          this.setState({
            lastPositionUpdate: moment()
          })

        }
      }
    })

  },

  render() {
    let player;
    const item = this.state.currentItem

    if (item) {
      player = <Player podcast={item} tickCallback={this.handleTick}/>
    } else {
      player = null
    }
    let positionUpdate = <br />

    if (this.state.lastPositionUpdate !== 0) {
      const time = this.state.lastPositionUpdate
      positionUpdate = <Row><p>Last sync: {time.fromNow()}</p></Row>
    }

    return (
      <div>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/">Podcaster</Link>
            </Navbar.Brand>
          </Navbar.Header>
        </Navbar>
        <Grid>
          <Row>
            {player}
          </Row>
          {positionUpdate}
        </Grid>
        {this.props.children && React.cloneElement(this.props.children, {
          itemClickedCallback: this.handlePodcastSelected
          })}
      </div>)
  }
})


const PodcastList = React.createClass({
  getInitialState: function () {
    return {
      podcasts: [],
      url: '/api/podcasts/'
    }
  },

  loadPodcasts: function () {
    $.ajax({
      url: this.state.url,
      dataType: 'json',
      success: data => this.setState({podcasts: data}),
      error: (xhr, status, err) => console.error(this.props.url, status, err.toString())
    })
  },


  componentDidMount: function () {
    this.loadPodcasts()
  },

  render: function () {
    let items = this.state.podcasts.map(function (podcast) {
      return (<Podcast item={podcast}/>)
    })

    return (
      <Grid>
        {items}
      </Grid>
    )
  }
})

const Podcast = React.createClass({
  render: function () {
    let item = this.props.item
    let link = `/podcasts/${item.id}`

    return (
        <Col sm={6} md={4} className="podcast">
          <Link to={link} className="podcast-image-link">
            <Image src={item.image_url} className="podcast-image" thumbnail />
          </Link>
          <div className="caption">
            <h3>{item.title}</h3>
          </div>
        </Col>
    )
  }
})

const PodcastDetails = React.createClass({
  getInitialState: function () {
    return {items: []}
  },

  getItems: function (id, offset, count) {
    const url = `/api/podcasts/${id}/${offset}/${count}`
    $.ajax({
      url: url,
      dataType: 'json',
      success: data => this.setState({items: data.items}),
      error: (xhr, status, err) => console.error(url, status, err.toString())
    })
  },

  componentDidMount: function () {
    const id = this.props.params.id
    this.getItems(id, 0, INITIAL_ITEM_COUNT)
  },

  render: function () {
    let items = this.state.items.map(item => {
      return (<PodcastItem data={item} key={item.id} itemClickedCallback={this.props.itemClickedCallback}/>)
    })
    return (
      <Grid id="podcast-details">
        {items}
      </Grid>
    )
  }
})

const PodcastItem = React.createClass({

  clickItem: function () {
    this.props.itemClickedCallback(this.props.data)
  },

  render: function () {
    const item = this.props.data
    const lastPos = moment.duration(item.last_position, 'seconds')
    const lastPosStr = `${lastPos.hours()} hr ${lastPos.minutes()} min`
    const duration = moment.duration(item.duration, 'seconds')
    const durationStr = `${duration.hours()} hr ${duration.minutes()} min`

    return (
      <div className="media podcast-item">
        <div className="media-left media-middle hidden-xs">
          <img width="120px" className="media-object podcast-item-image"
               src={item.image_url}
               alt={item.title}/>
        </div>

        <div className="media-body">
          <h4 className="media-heading">{item.title}</h4>
          <p className="description">{item.description}</p>
          <div className="col-md-6 played-time">
            <p>Played <b>{lastPosStr}</b> of <b>{durationStr}</b></p>
          </div>
          <div className="item-buttons pull-right">
            <Button onClick={this.clickItem}>
              <Glyphicon glyph="play"/> Play
            </Button>
            <Button>
              <Glyphicon glyph="fast-backward"/> Reset
            </Button>
          </div>
        </div>
      </div>
    )
  }
})

ReactDOM.render(
  <Router>
    <Route path="/" component={App}>
      <IndexRoute component={PodcastList}/>
      <Route path="podcasts/:id" component={PodcastDetails}/>
    </Route>
  </Router>,
  document.getElementById('react')
)
