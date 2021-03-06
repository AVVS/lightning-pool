# lightning-pool

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Dependencies][dependencies-image]][dependencies-url]
[![DevDependencies][devdependencies-image]][devdependencies-url]

## About

High performance resource pool for NodeJS.

 - Fastest Resource Pool implementation for NodeJS ever! Check out [benchmark](BANCHMARK.md) results
 - Advanced configuration options, suits for enterprise level applications
 - Configuration can be changed while pool running
 - Promise based factory supported
 - Supports validation and resource reset
 - Fully tested. (%100 coverage)

## Installation

  - `npm install lightning-pool --save`

## Example

```js
const lightningPool = require('lightning-pool');
const dbDriver = require('some-db-driver');

/**
 * Step 1 - Create a factory object
 */
const factory = {
    create: function(opts){
      return new Promise((resolve, reject) => {
        DbDriver.createClient((err, client) => {
          if (err)
            return reject(err);
          resolve(client);
        });  
      });     
    },
    destroy: function(client){        
       return new Promise((resolve, reject) => {
         client.destroy((err) => {
           if (err)
             return reject(err);
               resolve();
             });  
           });       
    },
    reset: function(client){        
       return new Promise((resolve, reject) => {
         client.rollback((err) => {
           if (err)
             return reject(err);
               resolve();
             });  
           });                    
    },
    validate: function(client){        
       return new Promise((resolve, reject) => {
         client.execute('some test sql', (err) => {
           if (err)
             return reject(err);
               resolve();
             });  
           });      
    }    
};

/**
 * Step 1 - Create a the pool object
 */
var opts = {  
    max: 10,    // maximum size of the pool
    min: 2,     // minimum size of the pool
    minIdle: 2  // minimum idle resources
}

var pool = lightningPool.createPool(factory, opts)

/**
 * Step 3 - Use pool in your code to acquire/release resources
 */

// acquire connection - Promise is resolved
// once a resource becomes available
pool.acquire().then(client => {  
  // Use resource
  client.query("select * from foo", [], function() {
    // return object back to pool
	pool.release(client);
  });  
}).catch(err => {
  console.error(err);
});


/**
 * Step 3 - Shutdown pool (optional)
 * Call close(force) when you need to shutdown the pool
 */
process.on('SIGINT', function() {
  pool.close(true);
});
```

## Documentation

### Creating a `Pool` instance

lightning-pool module exports createPool() method and Pool class. Both can be used to instantiate a Pool. 

```js
const lightningPool = require('lightning-pool');
const pool = lightningPool.createPool(factory, options);
```

```js
const {Pool} = require('lightning-pool');
const pool = new Pool(factory, options);
```

#### factory

Can be any object/instance with the following properties:

- `create` : The function that the `Pool` will call when it needs a new resource. It should return a `Promise<resouce>`.
- `destroy` : The function that the `Pool` will call when it wants to destroy a `resource`. It should accept first argument as `resource`,  where `resource` is whatever factory.create made. It should return a `Promise<>`.    
- `reset` (optional) : The function that the `Pool` will call before any `resource` back to the `Pool`. It should accept first argument as `resource`,  where `resource` is whatever factory.create made. It should return a `Promise<>`. `Pool` will destroy and remove the resource from the `Pool` on any error.
- `validate` (optional) : The function that the `Pool` will call when any resource needs to be validated. It should accept first argument as `resource`,  where `resource` is whatever factory.create made. It should return a `Promise<>`. `Pool` will destroy and remove the resource from the `Pool` on any error.

#### options
- `acquireMaxRetries`: Maximum number that `Pool` will try to create a resource before returning the error. (Default 0)
- `acquireRetryWait`: Time in millis that `Pool` will wait after each tries. (Default 2000) 
- `acquireTimeoutMillis`: Time in millis an acquire call will wait for a resource before timing out. (Default 0 - no limit) 
- `fifo`: If true resources will be allocated first-in-first-out order. resources will be allocated last-in-first-out order. (Default true)
- `idleTimeoutMillis`: The minimum amount of time in millis that an `resource` may sit idle in the `Pool`. (Default 30000) 
- `houseKeepInterval`: Time period in millis that `Pool` will make a cleanup. (Default 1000) 
- `min`: Minimum number of resources that `Pool` will keep. (Default 0)
- `minIdle`: Minimum number of resources that `Pool` will keep in idle state. (Default 0)
- `max`: Maximum number of resources that `Pool` will create. (Default 10)
- `maxQueue`: Maximum number of request that `Pool` will accept. (Default 1000)
- `resetOnReturn`: If true `Pool` will call `reset()` function of factory before moving it idle state. (Default true)
- `validation`: If true `Pool` will call `validation()` function of factory when it needs it. If false, `validation()` never been called. (Default true)

### Methods

#### Pool.prototype.acquire()

Acquires a `resource` from the `Pool` or create a new one.

##### Usage

`pool.acquire()`

- *Returns*: A Promise


```js
var promise = pool.acquire();
promise.then(resource => {
  // Do what ever you want with resource
}).catch(err =>{
  // Handle Error  
});
```

#### Pool.prototype.isAcquired()

Returns if a resource has been acquired from the `Pool` and not yet released or destroyed.

##### Usage

`pool.isAcquired(resource)`

- `resource`: A previously acquired resource
- *Returns*: True if the resource is acquired, else False

```js
if (pool.isAcquired(resource)) {
  // Do any thing
}
```



#### Pool.prototype.includes()

Returns if the `Pool` contains a resource

##### Usage

`pool.includes(resource)`

- `resource`: A resource object
- *Returns*: True if the resource is in the `Pool`, else False

```js
if (pool.includes(resource)) {
  // Do any thing
}
```



#### Pool.prototype.release()

Releases an allocated `resource` and let it back to pool.

##### Usage

`pool.release(resource)`

- `resource`: A previously acquired resource
- *Returns*: undefined

```js
pool.release(resource);
```




#### Pool.prototype.destroy()

Releases, destroys and removes any `resource` from `Pool`.

##### Usage

`pool.destroy(resource)`

- `resource`: A previously acquired resource
- *Returns*: undefined

```js
pool.destroy(resource);
```




#### Pool.prototype.start()

Starts the `Pool` and begins creating of resources, starts house keeping and any other internal logic.

*Note: This method is not need to be called. `Pool` instance will automatically be started when acquire() method is called*  

##### Usage

`pool.start()`

- *Returns*: undefined


```js
pool.start();
```



#### Pool.prototype.close()

Shuts down the `Pool` and destroys all resources.  

##### Usage (With promise)

`pool.close([force])`

- `force` (optional): If true, `Pool` will immediately destroy resources instead of waiting to be released (Default false)
- *Returns*: A Promise

```js
var promise = pool.close();
promise.then(() => {
  console.log('Pool has been shut down') 
}).catch(err => {
  console.error(err);  
});
```

### Properties


- `acquired` (Number): Returns number of acquired resources.
- `available` (Number): Returns number of idle resources.
- `creating` (Number): Returns number of resources currently been created.
- `pending` (Number): Returns number of acquire request waits in the `Pool` queue.
- `size` (Number): Returns number of total resources.
- `state` (PoolState): Returns current state of the `Pool`.
- `options` (PoolOptions): Returns object instance that holds configuration properties
    - `acquireMaxRetries` (Get/Set): Maximum number that `Pool` will try to create a resource before returning the error. (Default 0)
    - `acquireRetryWait` (Get/Set): Time in millis that `Pool` will wait after each tries. (Default 2000) 
    - `acquireTimeoutMillis` (Get/Set): Time in millis an acquire call will wait for a resource before timing out. (Default 0 - no limit) 
    - `fifo` (Get/Set): If true resources will be allocated first-in-first-out order. resources will be allocated last-in-first-out order. (Default true)
    - `idleTimeoutMillis` (Get/Set): The minimum amount of time in millis that an `resource` may sit idle in the `Pool`. (Default 30000) 
    - `houseKeepInterval` (Get/Set): Time period in millis that `Pool` will make a cleanup. (Default 1000) 
    - `min` (Get/Set): Minimum number of resources that `Pool` will keep. (Default 0)
    - `minIdle` (Get/Set): Minimum number of resources that `Pool` will keep in idle state. (Default 0)
    - `max` (Get/Set): Maximum number of resources that `Pool` will create. (Default 10)
    - `maxQueue` (Get/Set): Maximum number of request that `Pool` will acceps. (Default 1000)
    - `resetOnReturn` (Get/Set): If true `Pool` will call `reset()` function of factory before moving it idle state. (Default true)
    - `validation` (Get/Set): If true `Pool` will call `validation()` function of factory when it needs it. If false, `validation()` never been called. (Default true)    

### Events

Pool derives from EventEmitter and produce the following events:

- `acquire`: Emitted when a resource acquired.
    
```js
pool.on('acquire', function(resource){
  //....
})
```    
    
- `create`: Emitted when a new resource is added to the `Pool`.
```js
pool.on('create', function(resource){
  //....
})
```    

- `create-error`: Emitted when a factory.create informs any error.
```js
pool.on('create-error', function(error){
  //Log stuff maybe
})
```    

- `destroy`: Emitted when a resource is destroyed and removed from the `Pool`.
- `destroy-error`: Emitted when a factory.destroy informs any error.
```js
pool.on('destroy-error', function(error, resource){
  //Log stuff maybe
})
```    

- `return`: Emitted when an acquired resource returns to the `Pool`.
```js
pool.on('start', function(resource){
  //...
})
```    


- `start`: Emitted when the `Pool` started.
```js
pool.on('start', function(){
  //...
})
```    

- `closing`: Emitted when before closing the `Pool`.
```js
pool.on('closing', function(){
  //...
})
```    


- `close`: Emitted when after closing the `Pool`.
```js
pool.on('close', function(){
  //...
})
```    

- `validate-error`: Emitted when a factory.validate informs any error.
```js
pool.on('validate-error', function(error, resource){
  //Log stuff maybe
})
```    

## PoolState enum

Pool.PoolState (Number): 

- IDLE: 0,     // Pool has not been started
  
- STARTED: 1,  // Pool has been started
  
- CLOSING: 2, // Pool shutdown in progress
  
- CLOSED: 3   // Pool has been shut down
  


## Node Compatibility

  - node `>= 4.0`;
  
### License
[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/lightning-pool.svg
[npm-url]: https://npmjs.org/package/lightning-pool
[travis-image]: https://img.shields.io/travis/panates/lightning-pool/master.svg
[travis-url]: https://travis-ci.org/panates/lightning-pool
[coveralls-image]: https://img.shields.io/coveralls/panates/lightning-pool/master.svg
[coveralls-url]: https://coveralls.io/r/panates/lightning-pool
[downloads-image]: https://img.shields.io/npm/dm/lightning-pool.svg
[downloads-url]: https://npmjs.org/package/lightning-pool
[gitter-image]: https://badges.gitter.im/panates/lightning-pool.svg
[gitter-url]: https://gitter.im/panates/lightning-pool?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[dependencies-image]: https://david-dm.org/panates/lightning-pool/status.svg
[dependencies-url]:https://david-dm.org/panates/lightning-pool
[devdependencies-image]: https://david-dm.org/panates/lightning-pool/dev-status.svg
[devdependencies-url]:https://david-dm.org/panates/lightning-pool?type=dev
[quality-image]: http://npm.packagequality.com/shield/lightning-pool.png
[quality-url]: http://packagequality.com/#?package=lightning-pool
