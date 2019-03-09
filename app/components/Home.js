// @flow
import React, { Component, Fragment } from 'react';
import { Button, Dimmer, Header, Input, Loader } from 'semantic-ui-react';
import styles from './Home.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { run } from './fetch'
import authorize, { getLink, properLogin } from './login';



const fs = window.require('fs');


type Props = {};

export default class Home extends Component<Props> {
  state = {
    link: null,
    token: '',
    scrapeLink: '',
    oauth: null,
    loading: false,
  };

  componentDidMount(): void {
    authorize()
      .then((res) => {
        this.setState({
          oauth: res
        })
      })
      .catch(() => {
        const link = getLink()
        console.log(link)
        this.setState({
          link,
        })
      })
  }

  login = () => {
    properLogin(this.state.token)
      .then((res)=> {
        this.setState({
          oauth: res
        })
      })
  }

  scrape = () => {
    this.setState({
      loading: true,
    });
    run(this.state.oauth, this.state.scrapeLink)
      .then(() => {
        toast("przeszlo", {position: toast.POSITION.TOP_LEFT});
        this.setState({loading: false, scrapeLink: ''})
      })
      .catch(() => {
        toast("jeblo");
        this.setState({loading: false, scrapeLink: ''})
      })
  };

  render() {
    const { link, scrapeLink, oauth, loading } = this.state;
    return (
      <div className={styles.container} data-tid="container">
        <h2>DANIEL TO DEBIL</h2>
        {
          !oauth && <Fragment>
            <Header as='h5'>Click button below, login, and copy the code that will be displayed to the input below, then click Continue</Header>
            <Button onClick={()=> {require('electron').shell.openExternal(link)}}>Click here!</Button>
            <Input
              onChange={(e) => this.setState({token: e.target.value})}
              value={this.state.token}
              placeholder='Code...'
            />
            <Button onClick={this.login}>Continue</Button>
          </Fragment>
        }
        {
          oauth && <Fragment>
            <Input
              onChange={(e) => this.setState({scrapeLink: e.target.value})}
              value={scrapeLink}
              placeholder='Code...'
            />
            <Button onClick={this.scrape}>Scrape</Button>
          </Fragment>
        }
        {
          loading && <Dimmer active>
            <Loader>Loading</Loader>
          </Dimmer>
        }
      </div>
    );
  }
}
