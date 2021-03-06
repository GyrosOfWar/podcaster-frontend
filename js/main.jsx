require("./../sass/app.scss")

import * as React from "react";
import { Router, Route, IndexRoute, Link, hashHistory, withRouter } from "react-router";
import * as ReactDOM from "react-dom";
import $ from "jquery";
import {
  Navbar,
  Button,
  Grid,
  Row,
  Col,
  Image,
  Nav,
  NavItem,
  Glyphicon,
  Modal,
  Pagination,
  Input,
  FormGroup,
  ControlLabel,
  FormControl,
  Form
} from "react-bootstrap";
import Player from "./player/AudioPlayer";
import moment from "moment";
import auth from "./auth";

const PAGE_LEN = 15
const UPDATE_POSITION_INTERVAL = 15

function addAuthHeader(request) {
  request.setRequestHeader('Authorization', 'Bearer ' + auth.getToken())
}

const App = React.createClass({
  getInitialState() {
    return {
      currentItem: null,
      lastSync: moment(0),
      user: null
    }
  },

  handlePodcastSelected(item) {
    this.setState({currentItem: item})
  },

  getUser: function () {
    if (auth.isLoggedIn()) {
      $.ajax({
        url: '/api/users',
        method: 'GET',
        beforeSend: addAuthHeader,
        dataType: 'json',
        success: response => {
          this.setState({
            user: response
          })
        },
        error: (xhr, status, err) => console.error(this.props.url, status, err.toString())
      })
    }
  },

  handleTick(item, time) {
    item.lastPosition = Math.floor(time)
    const payload = JSON.stringify({ favorite: item.favorite, lastPosition: item.lastPosition})
    console.log(payload)
    $.ajax({
      url: `/api/feed_items/${item.id}`,
      method: 'POST',
      contentType: 'application/json',
      data: payload,
      beforeSend: addAuthHeader,
      success: response => {
        const now = moment()
        this.setState({
          lastSync: now
        })
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
      player = <Player podcast={item} tickCallback={this.handleTick} intervalDurationMs={UPDATE_POSITION_INTERVAL * 1000} />
    } else {
      player = ""
    }
    let positionUpdate = <br />

    const lastSync = this.state.lastSync
    if (lastSync.year() !== 1970) {
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
              <NavItem eventKey={1}>
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
      url: '/api/feeds',
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
      beforeSend: addAuthHeader,
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
        url: '/api/feeds',
        method: 'POST',
        data: {url: feedUrl},
        beforeSend: addAuthHeader,
        done: item => {
          this.closeModal()
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
              <label htmlFor="feed-url" className="sr-only">Feed-URL</label>
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
          <Button className="btn-lg" onClick={this.openModal}><Glyphicon glyph="plus"/></Button>
        </div>
        {modal}
        {heading}
        {items}
      </Grid>
    )
  }
})

const Podcast = React.createClass({
  getImageUrl: function (item) {
    return `/api/images/${item.hashedImageUrl}?size=350`
  },

  render: function () {
    const item = this.props.item
    const link = `/podcasts/${item.id}/page/1`
    const imageUrl = this.getImageUrl(item)

    return (
      <Col sm={6} md={4} className="podcast">
        <Link to={link} className="podcast-image-link">
          <Image src={imageUrl} className="podcast-image" thumbnail/>
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
        url: `/api/feeds/${id}/search`,
        method: 'POST',
        data: {query: input},
        dataType: 'json',
        beforeSend: addAuthHeader,
        success: response => {
          this.props.searchResultCallback(response)
        }
      })
    } else {
      this.props.searchFinishedCallback()
    }
  },
  render: function () {
    return <FormControl type="text" placeholder="Search" onChange={this.keyPressed} id="search-box"/>
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
    const url = `/api/feeds/${id}/items?page=${pageNum - 1}&size=${PAGE_LEN}`
    $.ajax({
      url: url,
      dataType: 'json',
      beforeSend: addAuthHeader,
      success: data => {
        this.setState({
          items: data.content,
          pageCount: data.totalPages
        })
      },
      error: (xhr, status, err) => console.error(url, status, err.toString())
    })
  },

  randomPodcast: function () {
    const id = this.props.params.id
    $.ajax({
      url: `/api/feeds/${id}/random`,
      dataType: 'json',
      beforeSend: addAuthHeader,
      success: data => {
        this.props.itemClickedCallback(data)
      },
      error: (xhr, status, err) => console.error(url, status, err.toString())
    })
  },

  refresh: function () {
    const id = this.props.params.id

    $.ajax({
      url: `/api/feeds/${id}`,
      method: 'POST',
      dataType: 'json',
      beforeSend: addAuthHeader,
      success: result => {
        result.reverse()
        this.setState({
          items: [...result, ...this.state.items]
        })
      },
      error: (xhr, status, err) => console.error(this.props.url, status, err.toString())
    })
  },

  componentWillReceiveProps: function (newProps) {
    this.getItems(newProps.params.id, newProps.params.page)
  },

  handlePageSelect: function (event, selectedEvent) {
    this.setState({
      page: event
    })
    this.getItems(this.props.params.id, event)
  },

  handleItemFavorited: function (item) {
    const id = item.id
    item.favorite = !item.favorite
    const payload = JSON.stringify({ favorite: item.favorite, lastPosition: item.lastPosition})
    $.ajax({
      url: `/api/feed_items/${id}`,
      method: 'POST',
      contentType: 'application/json',
      data: payload,
      beforeSend: addAuthHeader,
      success: response => {
        this.forceUpdate()
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
          url: `/api/feeds/${id}/favorites`,
          method: 'GET',
          dataType: 'json',
          beforeSend: addAuthHeader,
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
                                 favoriteItemCallback={this.handleItemFavorited}/>)
    })

    let pagination = null
    if (!this.state.searching && !this.state.showingFavorites) {
      const page = this.state.page || 1;
      pagination = <Pagination prev next first last ellipsis items={this.state.pageCount} maxButtons={5}
                               activePage={page} onSelect={this.handlePageSelect}/>
    }
    return (
      <Grid id="podcast-details">
        <Row>
          <Col md={4} xs={12} id="search-box-container" mdPush={8}>
            <SearchBox feedId={this.props.params.id} searchResultCallback={this.handleSearch}
                       searchFinishedCallback={this.handleSearchStopped}/>
          </Col>
          <Col md={4} mdPull={4}>
            <Button onClick={this.refresh}>
              <Glyphicon glyph="refresh"/> <span className="hidden-xs">Refresh</span>
            </Button>
            <Button onClick={this.randomPodcast}>
              <Glyphicon glyph="random"/> <span className="hidden-xs">Random</span>
            </Button>
            <Button onClick={this.filterFavorites}>
              <Glyphicon glyph="star"/> <span className="hidden-xs">Favorites</span>
            </Button>
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

  getImageUrl: function(item) {
    return `/api/images/${item.hashedImageUrl}?size=120`
  },

  render: function () {
    const item = this.props.data
    const lastPos = moment.duration(item.lastPosition, 'seconds')
    const lastPosStr = `${lastPos.hours()} hr ${lastPos.minutes()} min`
    const duration = moment.duration(item.duration, 'seconds')
    const durationStr = `${duration.hours()} hr ${duration.minutes()} min`

    let starGlyph = null
    let starClassName = null
    if (item.favorite) {
      starGlyph = 'star'
      starClassName = 'favorited-icon'
    } else {
      starGlyph = 'star-empty'
      starClassName = ''
    }
    
    const imageUrl = this.getImageUrl(item)
    return (
      <div className="media podcast-item">
        <div className="media-left media-middle">
          <img width="120px" className="media-object podcast-item-image hidden-xs"
               src={imageUrl}
               alt={item.title}/>
        </div>

        <div className="media-body">
          <h4 className="media-heading">{item.title}</h4>
          <p className="podcast-item-description">{item.description}</p>
          <div className="col-md-6 played-time">
            <p>Played <b>{lastPosStr}</b> of <b>{durationStr}</b></p>
            <Button onClick={this.clickItem}>
              <Glyphicon glyph="play"/> <span className="hidden-xs">Play</span>
            </Button>
            <Button onClick={this.favoriteItem}>
              <Glyphicon glyph={starGlyph} className={starClassName}/> <span className="hidden-xs">Favorite</span>
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

const Login = withRouter(React.createClass({
  getInitialState: function () {
    return {
      error: false
    }
  },

  handleSubmit: function (event) {
    event.preventDefault()

    const username = $("#username").val();
    const password = $("#password").val();

    auth.login(username, password, response => {
      if (response) {
        const location = this.props.location
        if (location.state && location.state.nextPathname) {
          this.props.router.replace(location.state.nextPathname)
        } else {
          this.props.router.replace('/')
        }
      } else {
        this.setState({error: true})
      }
    })
  },

  render: function () {
    return (
      <Grid>
        <Form onSubmit={this.handleSubmit}>
          <FormGroup controlId="username">
            <ControlLabel>Username</ControlLabel>
            <FormControl type="text" placeholder="Enter username" id="username"/>
          </FormGroup>

          <FormGroup controlId="password">
            <ControlLabel>Password</ControlLabel>
            <FormControl type="password" placeholder="Enter password" id="password"/>
          </FormGroup>

          <Button type="submit">Login</Button>
        </Form>
      </Grid>
    )
  }
}))

const Logout = React.createClass({
  componentDidMount() {
    auth.logout()
  },

  render() {
    return <p>You are now logged out</p>
  }
})

const HistoryItem = React.createClass({
  render: function () {
    return <li>{this.props.item.feedItem.title}</li>
  }
})

const FeedHistory = React.createClass({
  getInitialState: function () {
    return {
      history: []
    }
  },

  getHistory: function () {
    $.ajax({
      url: `/api/users/history`,
      method: 'GET',
      dataType: 'json',
      beforeSend: addAuthHeader,
      success: response => {
        this.setState({
          history: response.content
        })
      }
    })
  },

  componentDidMount: function () {
    this.getHistory()
  },

  render: function () {
    const history = this.state.history.map(e => <HistoryItem item={e} />)

    return (
      <Grid>
        <p>History for user {this.props.user.name}</p>
        <ul>
          {history}
        </ul> 
      </Grid>
    )
  }
})

function requireAuth(nextState, replace) {
  if (!auth.isLoggedIn()) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

ReactDOM.render(
  <Router history={hashHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={PodcastList} onEnter={requireAuth}/>
      <Route path="login" component={Login}/>
      <Route path="logout" component={Logout}/>
      <Route path="history" component={FeedHistory} />
      <Route path="podcasts/:id/page/:page" component={PodcastDetails} onEnter={requireAuth}/>
      <Route path="*" component={NotFound}/>
    </Route>
  </Router>,
  document.getElementById('react')
)
