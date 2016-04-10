require("./../sass/app.scss")

import React from 'react'
import { Router, Route, IndexRoute, Link, hashHistory } from 'react-router'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import { Navbar, Button, Grid, Row, Col, Image, Nav, NavItem, Glyphicon, Modal, Pagination, Input } from 'react-bootstrap'
import Player from './player/AudioPlayer'
import moment from 'moment'

const PAGE_LEN = 15
const UPDATE_POSITION_INTERVAL = 15

const App = React.createClass({
  getInitialState() {
    return {
      currentItem: null,
      lastSync: 0,
      user: null
    }
  },

  handlePodcastSelected(item) {
    this.setState({currentItem: item})
  },

  getUser: function () {
    $.ajax({
      url: '/api/user',
      method: 'GET',
      dataType: 'json',
      success: response => {
        this.setState({
          user: response
        })
      },
      error: (xhr, status, err) => console.error(this.props.url, status, err.toString())
    })
  },

  handleTick(item, time) {
    const now = moment()
    const nextUpdate = moment(this.state.lastSync).add(moment(UPDATE_POSITION_INTERVAL, 'seconds'))

    if (now.isBefore(nextUpdate) || time === 0) {
      return
    }

    const t = Math.round(time)
    $.ajax({
      url: `/api/update_position/${item.id}/${t}`,
      method: 'POST',
      success: response => {
        if (response === 'OK') {
          const now = moment()
          this.setState({
            lastSync: now
          })
        }
      }
    })
  },

  componentDidMount: function () {
    this.getUser()
  },

  render() {
    const item = this.state.currentItem
    let player
    if (item) {
      player = <Player podcast={item} tickCallback={this.handleTick}/>
    } else {
      player = null
    }
    let positionUpdate = <br />

    const lastSync = this.state.lastSync
    if (lastSync !== 0) {
      positionUpdate = <Row><p>Last sync: {lastSync.fromNow()}</p></Row>
    }
    // TODO add 'sync now' button
    return (
      <div>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/">Podcaster</Link>
            </Navbar.Brand>
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav pullRight>
              <NavItem eventKey={1} href="/logout">
                Logout
              </NavItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Grid>
          <Row>
            {player}
          </Row>
          {positionUpdate}
        </Grid>
        {this.props.children && React.cloneElement(this.props.children, {
          itemClickedCallback: this.handlePodcastSelected,
          user: this.state.user
        })}
      </div>)
  }
})


const PodcastList = React.createClass({
  getInitialState: function () {
    return {
      podcasts: [],
      url: '/api/podcasts/',
      showModal: false
    }
  },

  openModal: function () {
    this.setState({showModal: true})
  },

  closeModal: function () {
    this.setState({showModal: false})
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

  addPodcast: function () {
    const feedUrl = $('#feed-url').val()
    if (feedUrl) {
      $.ajax({
        url: '/api/podcast/',
        method: 'POST',
        data: {url: feedUrl},
        done: item => {
          this.setState({
            podcasts: [...this.state.podcasts, item]
          })
        },
        error: (xhr, status, err) => console.error(this.props.url, status, err.toString())
      })
    } else {
      alert('Enter a URL!')
    }
  },

  render: function () {
    const items = this.state.podcasts.map(function (podcast) {
      return (<Podcast item={podcast} key={podcast.id}/>)
    })

    let heading = null
    if (this.props.user) {
      const name = this.props.user.name
      const niceName = name.charAt(0).toUpperCase() + name.slice(1)
      heading = <h1>{niceName}'s Podcasts</h1>
    }

    const modal =
      <Modal show={this.state.showModal} onHide={this.closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add podcast</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-inline">
            <div className="form-group">
              <label for="feed-url" className="sr-only">Feed-URL</label>
              <input type="text" id="feed-url" className="form-control" placeholder="Feed-URL" size="60"/>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default" data-dismiss="modal" onClick={this.closeModal}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" data-dismiss="modal" onClick={this.addPodcast}>
            Add
          </button>
        </Modal.Footer>
      </Modal>

    return (
      <Grid>
        <div className="form-inline pull-right">
          <Button className="btn-lg" onClick={this.openModal}>+</Button>
        </div>
        {modal}
        {heading}
        {items}
      </Grid>
    )
  }
})

const Podcast = React.createClass({
  render: function () {
    let item = this.props.item
    let link = `/podcasts/${item.id}/page/1`

    return (
      <Col sm={6} md={4} className="podcast">
        <Link to={link} className="podcast-image-link">
          <Image src={item.image_url} className="podcast-image" thumbnail/>
        </Link>
        <div className="caption">
          <h3>{item.title}</h3>
        </div>
      </Col>
    )
  }
})

const SearchBox = React.createClass({
  keyPressed: function () {
    const input = $('#search-box').val()
    const id = this.props.feedId
    if (input.length >= 3) {
      $.ajax({
        url: `/api/podcast/search/${id}`,
        method: 'POST',
        data: {query: input},
        dataType: 'json',
        success: response => {
          this.props.searchResultCallback(response)
        }
      })
    } else {
      this.props.searchFinishedCallback()
    }
  },
  render: function () {
    return <Input type="text" placeholder="Search" onChange={this.keyPressed} id="search-box"/>
  }
})

const PodcastDetails = React.createClass({
  getInitialState: function () {
    return {
      items: [],
      page: null,
      pageCount: null,
      showingFavorites: false,
      searching: false,
      searchResults: [],
      favorites: []
    }
  },

  getItems: function (id, pageNum) {
    const count = PAGE_LEN
    const offset = (pageNum - 1) * PAGE_LEN

    const url = `/api/podcasts/${id}/${offset}/${count}`
    $.ajax({
      url: url,
      dataType: 'json',
      success: data => {
        this.setState({
          items: data.items,
          pageCount: data.page_count
        })
      },
      error: (xhr, status, err) => console.error(url, status, err.toString())
    })
  },

  randomPodcast: function () {
    const id = this.props.params.id
    $.ajax({
      url: `/api/random_podcast/${id}`,
      dataType: 'json',
      success: data => {
        this.props.itemClickedCallback(data)
      },
      error: (xhr, status, err) => console.error(url, status, err.toString())
    })
  },

  refresh: function () {
    const id = this.props.params.id

    $.ajax({
      url: `/api/refresh/${id}`,
      method: 'POST',
      dataType: 'json',
      success: result => {
        result.reverse()
        this.setState({
          items: [...result, ...this.state.items]
        })
      },
      error: (xhr, status, err) => console.error(this.props.url, status, err.toString())
    })
  },

  componentDidMount: function () {
    this.getItems(this.props.params.id, this.props.params.page)
  },

  componentWillReceiveProps: function (newProps) {
    this.getItems(newProps.params.id, newProps.params.page)
  },

  handlePageSelect: function (event, selectedEvent) {
    this.setState({
      page: selectedEvent.eventKey
    })
    this.getItems(this.props.params.id, selectedEvent.eventKey)
  },

  handleItemFavorited: function (item) {
    const id = item.id
    $.ajax({
      url: `/api/podcasts/fav/${id}`,
      method: 'POST',
      success: response => {
        // TODO could be a lot more efficient
        const newItems = this.state.items.slice()
        const itemToChange = newItems.find(item => item.id === id)
        const idx = newItems.indexOf(itemToChange)
        itemToChange.favorited = response === 'true'
        newItems[idx] = itemToChange

        this.setState({
          items: newItems
        })
      }
    })
  },

  handleSearch: function (response) {
    this.setState({
      searchResults: response,
      searching: true
    })
  },

  handleSearchStopped: function () {
    this.setState({
      searching: false
    })
  },

  filterFavorites: function () {
    if (this.state.showingFavorites) {
      this.setState({
        showingFavorites: false
      })
    } else {
      if (this.state.favorites.length == 0) {
        const id = this.props.params.id
        $.ajax({
          url: `/api/podcast/favorites/${id}`,
          method: 'GET',
          dataType: 'json',
          success: response => {
            this.setState({
              favorites: response,
              showingFavorites: true
            })
          }
        })
      } else {
        this.setState({
          showingFavorites: true
        })
      }
    }
  },

  render: function () {
    let itemSource = null
    if (this.state.searching) {
      itemSource = this.state.searchResults
    } else if (this.state.showingFavorites) {
      itemSource = this.state.favorites
    } else {
      itemSource = this.state.items
    }

    const items = itemSource.map(item => {
      return (<PodcastDetailItem data={item} key={item.id} itemClickedCallback={this.props.itemClickedCallback}
                                 favoriteItemCallback={this.handleItemFavorited} />)
    })

    let pagination = null
    if (!this.state.searching) {
      pagination = <Pagination prev next first last ellipsis items={this.state.pageCount} maxButtons={5}
                               activePage={this.state.page} onSelect={this.handlePageSelect}/>
    }
    return (
      <Grid id="podcast-details">
        <Row>
          <Col md={4}>
            <Button onClick={this.refresh}>
              <Glyphicon glyph="refresh"/> Refresh
            </Button>
            <Button onClick={this.randomPodcast}>
              <Glyphicon glyph="random"/> Random
            </Button>
            <Button onClick={this.filterFavorites}>
              <Glyphicon glyph="star" /> Favorites
            </Button>
          </Col>
          <Col md={4} className="pull-right" >
              <SearchBox feedId={this.props.params.id} searchResultCallback={this.handleSearch}
              searchFinishedCallback={this.handleSearchStopped}/>
          </Col>
        </Row>
        {items}
        {pagination}
      </Grid>
    )
  }
})

const PodcastDetailItem = React.createClass({

  clickItem: function () {
    this.props.itemClickedCallback(this.props.data)
  },

  favoriteItem: function () {
    this.props.favoriteItemCallback(this.props.data)
  },

  render: function () {
    const item = this.props.data
    const lastPos = moment.duration(item.last_position, 'seconds')
    const lastPosStr = `${lastPos.hours()} hr ${lastPos.minutes()} min`
    const duration = moment.duration(item.duration, 'seconds')
    const durationStr = `${duration.hours()} hr ${duration.minutes()} min`

    let starGlyph = null
    let starClassName = null
    if (item.favorited) {
      starGlyph = 'star'
      starClassName = 'favorited-icon'
    } else {
      starGlyph = 'star-empty'
      starClassName = ''
    }

    return (
      <div className="media podcast-item">
        <div className="media-left media-middle">
          <img width="120px" className="media-object podcast-item-image hidden-xs"
               src={item.image_url}
               alt={item.title}/>
        </div>

        <div className="media-body">
          <h4 className="media-heading">{item.title}</h4>
          <p className="podcast-item-description">{item.description}</p>
          <div className="col-md-6 played-time">
            <p>Played <b>{lastPosStr}</b> of <b>{durationStr}</b></p>
          </div>
          <div className="item-buttons pull-right">
            <Button onClick={this.clickItem}>
              <Glyphicon glyph="play"/> Play
            </Button>
            <Button onClick={this.favoriteItem}>
              <Glyphicon glyph={starGlyph} className={starClassName}/> Favorite
            </Button>
          </div>
        </div>
      </div>
    )
  }
})

const NotFound = React.createClass({
  render: function () {
    return <Grid>
      <h1>Page not found!</h1>
    </Grid>
  }
})

ReactDOM.render(
  <Router history={hashHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={PodcastList}/>
      <Route path="podcasts/:id/page/:page" component={PodcastDetails}/>
      <Route path="*" component={NotFound}/>
    </Route>
  </Router>,
  document.getElementById('react')
)
