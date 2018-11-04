const express = require('express')
const app = express()
const udp = require('dgram')
const port = 3000
const R = require('ramda')

const SERVER = "10.254.1.1"

const client = udp.createSocket('udp4');

const world = require('./world.json');
const lights = R.flatten(world.groups.map(g => g.devices.map(d => ({...d, group: g.id})).filter(d => d.type === 'light'))).sort((a, b) => {
  a.y+a.x < b.y+b.x
})
const buttons = R.flatten(world.groups.map(g => g.devices.filter(d => d.type === 'button')))
const sensors = R.flatten(world.groups.map(g => g.devices.filter(d => d.type === 'ms')))
//console.log(lights)

function send(cmd) {
  var data = Buffer.from(cmd);
  client.send(data,50001,SERVER, function(error){
    if(error){
      console.log(error)
      client.close();
    }
  });
}
app.use(express.json())
app.use(express.static('pub'))

function setLight(address, props) {
  const p = Object.assign({level: 0, fade: 0}, props)
  const cmd = `>V:1,C:14,L:${p.level},F:${p.fade},${address}#`
  send(cmd)
}

function setGroup(group, props) {
  const p = Object.assign({level: 0, fade: 0}, props)
  const cmd = `>V:1,C:13,G:${group},L:${p.level},F:${p.fade}#`
  send(cmd)
}


app.get('/api/world', (req, res) => res.send(world))
app.get('/api/groups', (req, res) => {
  res.send(world.groups.map(g => ({name: g.name, id: g.id})))
})

app.get('/api/groups/:group', (req, res) => {
  const g = world.groups.find(g => g.id === req.params.group)
  if (!g) return res.status(404).send("not-found")
  res.send(world.groups.find(g => g.id === req.params.group))
})

app.put('/api/groups/:group', (req, res) => {
  const g = world.groups.find(g => g.id === req.params.group)
  if (!g) return res.status(404).send("not-found")
  setGroup(req.params.group, req.body)
  res.send({status: "ok"})
})

app.put('/api/lights/:light', (req, res) => {
  const l = lights.find(d => d.address === req.params.light)
  if (!l) return res.status(404).send("not-found")
  setLight(req.params.light, req.body)
  res.send({status: "ok"})
})

function pick(items) {
  return items[Math.floor(Math.random()*items.length)];
}



app.listen(port, () => console.log(`Helvar HACK listening on port ${port}!`))
