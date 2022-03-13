import React from 'react'
import ReactDOM from 'react-dom'

const question = 'Is it working?'
const answer = (window as any).isItWorking

const App = () => (
    <div>
        <span>{question}</span>
        <span>{answer}</span>
    </div>
)

ReactDOM.render(<App />, document.body)
