require("./../sass/app.scss")

import React from 'react'
import { Router, Route, IndexRoute, Link } from 'react-router'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import {Navbar, Button, Grid, Row, Col, Image, Nav, NavItem } from 'react-bootstrap'
import Player from './player/AudioPlayer'

const INITIAL_ITEM_COUNT = 15

const App = React.createClass({
  render() {
    const songs = [{url: 'http://www.giantbomb.com/podcasts/download/1460/Giant_Bombcast_12_22_2015-12-22-2015-2201689492.mp3',
    name: 'Giant Bombcast'}]

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
            <Player songs={songs}/>
          </Row>
        </Grid>
        {this.props.children}
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
      success: function (data) {
        this.setState({podcasts: data})
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString())
      }.bind(this)
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
      success: function (data) {
        this.setState({items: data.items})
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(url, status, err.toString())
      }
    })
  },

  componentDidMount: function () {
    const id = this.props.params.id
    this.getItems(id, 0, INITIAL_ITEM_COUNT)
  },

  render: function () {
    let items = this.state.items.map(function (item) {
      return (<PodcastItem data={item}/>)
    })
    return (
      <Grid id="podcast-details">
        {items}
      </Grid>
    )
  }
})

const PodcastItem = React.createClass({
  render: function () {
    let item = this.props.data

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
            <p>Played <b>{item.last_position_string}</b> of <b>{item.duration_string}</b></p>
          </div>
          <div className="item-buttons pull-right">
            <Button>Play</Button>
            <Button>Reset</Button>
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
