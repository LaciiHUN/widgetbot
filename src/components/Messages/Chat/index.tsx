import { connect } from 'fluent'
import * as React from 'react'

import { Field, Root } from './elements'
import Emoji from './Emoji'
import Input from './Input'

export let input: HTMLInputElement = null

export default connect()
  .with(({ state, signals, props }) => ({
    channel: state.channel.get(),
    activeChannel: state.activeChannel,
    sendMessage: signals.sendMessage,
    clientTyping: signals.typing
  }))
  .toClass(
    props =>
      class Chat extends React.PureComponent<typeof props> {
        state = {
          rows: 1
        }

        onChange(value: string) {
          const rows = value.split(/\r\n|\r|\n/).length
          this.setState({ rows })
        }

        onSubmit(message: string) {
          const { sendMessage, activeChannel } = this.props
          sendMessage({
            channel: activeChannel,
            message
          })

          // TODO: Clear the input field only when the user is signed in.
          // Currently it's throwing an error whenever I observe the
          // state.user object. It's probably due to the shit-ish flow
          // that I created, or a bug with cerebral.
          input.value = ''
        }

        isTyping(typing: boolean) {
          const { activeChannel, clientTyping } = this.props
          clientTyping({ channel: activeChannel, typing })
        }

        render() {
          const { channel } = this.props

          return (
            <Root>
              <Field rows={this.state.rows}>
                <Input
                  onChange={this.onChange.bind(this)}
                  onSubmit={this.onSubmit.bind(this)}
                  inputRef={ref => (input = ref)}
                  onKeyPress={this.typing.bind(this)}
                  placeholder={channel ? `Message #${channel.name}` : null}
                />
                <Emoji />
              </Field>
            </Root>
          )
        }

        monitor = {
          last: null,
          timer: null
        }

        typing() {
          // Typing timeout threshold
          const threshold = 1000

          const now = +new Date()
          const { monitor } = this

          // Clear the previous stopped-typing timer
          clearTimeout(this.monitor.timer)

          // If they don't register a keypress within the threshold
          // then they've stopped typing
          this.monitor.timer = setTimeout(() => {
            this.isTyping(false)
            this.monitor.last = null
          }, threshold)

          // If the threshold time has passed, then send another
          // keypress event to the server
          if (now - monitor.last > threshold) {
            this.isTyping(true)
            monitor.last = now
          }
        }
      }
  )
