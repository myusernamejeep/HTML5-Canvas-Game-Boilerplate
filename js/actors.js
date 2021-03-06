/**
 * Defines useful classes for actors in the world.
 *
 * Specifically, this file holds the Box, Actor, Player, Collection, TileMap,
 * Layer, and World classes. Though not strictly boilerplate, Layer and World
 * are useful for any Canvas project, and the rest are are useful abstractions
 * for practically any game-style environment.
 *
 * @ignore
 */

/**
 * A Box shape.
 *
 * Boxes have a position, size, and visual representation.
 *
 * @constructor
 *   Creates a new Box instance.
 * 
 * @param {Number} [x]
 *   The x-coordinate of the top-left corner of the Box. Defaults to the center
 *   of the world.
 * @param {Number} [y]
 *   The y-coordinate of the top-left corner of the Box. Defaults to the center
 *   of the world.
 * @param {Number} [w]
 *   The width of the Box. Defaults to
 *   {@link Box#DEFAULT_WIDTH Box.prototype.DEFAULT_WIDTH}.
 * @param {Number} [h]
 *   The height of the Box. Defaults to
 *   {@link Box#DEFAULT_HEIGHT Box.prototype.DEFAULT_HEIGHT}.
 * @param {Mixed} [fillStyle="black"]
 *   A default fillStyle to use when drawing the Box. Defaults to black.
 */
var Box = Class.extend({
  init: function(x, y, w, h, fillStyle) {
    /**
     * @property {Number} x
     *   The x-coordinate of the top-left corner of the Box.
     */
    this.x = x || Math.floor((world.width-this.DEFAULT_WIDTH)/2);
    /**
     * @property {Number} y
     *   The y-coordinate of the top-left corner of the Box.
     */
    this.y = y || Math.floor((world.height-this.DEFAULT_HEIGHT)/2);
    /**
     * @property {Number} width
     *   The width of the Box.
     */
    this.width = w || this.DEFAULT_WIDTH;
    /**
     * @property {Number} height
     *   The height of the Box.
     */
    this.height = h || this.DEFAULT_HEIGHT;
    /**
     * @property {String} fillStyle
     *   A fillStyle to use when drawing the Box if no `src` is specified.
     */
    this.fillStyle = fillStyle || 'black';

    this.draw();
  },
  /**
   * The default width of a Box.
   */
  DEFAULT_WIDTH: 80,
  /**
   * The default height of a Box.
   */
  DEFAULT_HEIGHT: 80,
  /**
   * Something that can be drawn by {@link CanvasRenderingContext2D#drawImage}.
   *
   * If not set, a box will be drawn instead using the fillStyle.
   */
  src: null,
  /**
   * The angle (in radians) at which to draw the Box.
   */
  radians: 0,
  /**
   * Draw the Box.
   *
   * Draws the shape in Box#drawDefault() unless the Box#src property is set.
   *
   * Use Box#drawBoundingBox() to draw an outline of the Box.
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which this Box should be drawn. This is
   *   useful for drawing onto {@link Layer}s. If not specified, defaults to
   *   the {@link global#context global context} for the default canvas.
   * @param {Boolean} [smooth=true]
   *   A boolean indicating whether to force the Box to be drawn at whole-pixel
   *   coordinates. If you don't already know that your coordinates will be
   *   integers, this option can speed up painting since the browser does not
   *   have to interpolate the image.
   */
  draw: function(ctx, smooth) {
    ctx = ctx || context;
    if (typeof smooth === 'undefined') {
      smooth = true;
    }
    ctx.save();
    ctx.fillStyle = this.fillStyle;
    var x = this.x, y = this.y, w = this.width, h = this.height;
    if (smooth) {
      x = Math.round(x);
      y = Math.round(y);
    }
    if (this.radians) {
      ctx.translate(x+w/2, y+h/2);
      ctx.rotate(this.radians);
      ctx.translate(-w/2-x, -h/2-y);
    }
    if (this.src) {
      ctx.drawImage(this.src, x, y, w, h);
    }
    else {
      this.drawDefault(ctx, x, y, w, h);
    }
    ctx.restore();
  },
  /**
   * {@link Box#draw Draw} the default shape when no image has been applied.
   *
   * This is useful to override for classes that have different standard
   * appearances, rather than overriding the whole Box#draw() method.
   *
   * @param {CanvasRenderingContext2D} ctx
   *   A canvas graphics context onto which this Box should be drawn.
   * @param {Number} x
   *   The x-coordinate of the upper-left corner of the Box.
   * @param {Number} y
   *   The y-coordinate of the upper-left corner of the Box.
   * @param {Number} w
   *   The width of the Box.
   * @param {Number} h
   *   The height of the Box.
   */
  drawDefault: function(ctx, x, y, w, h) {
    ctx.fillRect(x, y, w, h);
  },
  /**
   * Draw the outline of the Box used to calculate collision.
   *
   * To draw the Box itself, use Box#draw().
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which the outline should be drawn. This
   *   is useful for drawing onto {@link Layer}s. If not specified, defaults to
   *   the {@link global#context global context} for the default canvas.
   * @param {Mixed} [strokeStyle]
   *   A style to use for the box outline.
   */
  drawBoundingBox: function(ctx, strokeStyle) {
    ctx = ctx || context;
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
    }
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  },
  /**
   * Get the x-coordinate of the center of the Box.
   *
   * See also Box#yC()
   */
  xC: function() {
    return this.x + this.width/2;
  },
  /**
   * Get the y-coordinate of the center of the Box.
   *
   * See also Box#xC()
   */
  yC: function() {
    return this.y + this.height/2;
  },
  /**
   * Determine whether this Box overlaps with another Box or set of Boxes.
   *
   * The main difference between Box#collides() and Box#overlaps() is that
   * Box#overlaps() only checks against a single Box and returns a Boolean
   * indicating whether there is overlap, whereas Box#collides() can check
   * against many Boxes and returns the first item to overlap (if any).
   *
   * @param {Box/Collection/TileMap} collideWith
   *   A Box, Collection of Boxes, or TileMap with which to check for overlap.
   *
   * @return {Box/Boolean}
   *   false if there is no overlap; otherwise, the first item to overlap.
   */
  collides: function(collideWith) {
    if (collideWith instanceof Box) {
      return this.overlaps(collideWith) ? collideWith : false;
    }
    else if (collideWith instanceof Collection || collideWith instanceof TileMap) {
      var items = collideWith.getAll();
      for (var i = 0, l = items.length; i < l; i++) {
        if (this.overlaps(items[i])) {
          return items[i];
        }
      }
    }
    return false;
  },
  /**
   * Determine whether this Box intersects another Box.
   *
   * See Box#collides() for a discussion of the difference.
   *
   * See Box#overlapsX() and Box#overlapsY() for the actual calculations.
   *
   * @param {Box} otherBox The other Box with which to check for collision.
   */
  overlaps: function(otherBox) {
    return this.overlapsX(otherBox) && this.overlapsY(otherBox);
  },
  /**
   * Determine whether this Box intersects another Box on the x-axis.
   *
   * See also Box#overlaps() and Box#overlapsY()
   *
   * @param {Box} otherBox The other Box with which to check for collision.
   */
  overlapsX: function(otherBox) {
    return this.x + this.width >= otherBox.x && otherBox.x + otherBox.width >= this.x;
  },
  /**
   * Determine whether this Box intersects another Box on the y-axis.
   *
   * See also Box#overlaps() and Box#overlapsX()
   *
   * @param {Box} otherBox The other Box with which to check for collision.
   */
  overlapsY: function(otherBox) {
    return this.y + this.height >= otherBox.y && otherBox.y + otherBox.height >= this.y;
  },
  /**
   * Determine whether the mouse is hovering over this Box.
   */
  isHovered: function() {
    return App.isHovered(this);
  },
  /**
   * Listen for a specific event.
   *
   * To only run the callback the first time the event is triggered on this
   * Box, see Box#once(). To remove a callback, see Box#unlisten().
   *
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will bind to the
   *   "click" event with the "custom" namespace. Namespaces are useful for
   *   unlisten()ing to specific callbacks assigned to that namespace or for
   *   unlisten()ing to callbacks bound to a namespace across multiple events.
   * @param {Function} callback
   *   A function to execute when the relevant event is triggered on the
   *   listening object. The function's `this` object is the listening Box
   *   and it receives any other parameters passed by the trigger call. Usually
   *   an event object is the first parameter, and propagation can be stopped
   *   by calling the event's stopPropagation() method.
   * @param {Number} [weight=0]
   *   An integer indicating the order in which callbacks for the relevant
   *   event should be triggered. Lower numbers cause the callback to get
   *   triggered earlier than higher numbers. This can be useful for getting
   *   around the fact that the canvas doesn't track display order so event
   *   callbacks can't distinguish which object should be triggered first if
   *   multiple listening objects are overlapping.
   */
  listen: function(eventName, callback, weight) {
    App.Events.listen(this, eventName, callback, weight);
    return this;
  },
  /**
   * Listen for a specific event and only react the first time it is triggered.
   *
   * This method is exactly the same as Box#listen() except that the specified
   * callback is only executed the first time it is triggered. To remove a
   * callback, see Box#unlisten().
   *
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will bind to the
   *   "click" event with the "custom" namespace. Namespaces are useful for
   *   unlisten()ing to specific callbacks assigned to that namespace or for
   *   unlisten()ing to callbacks bound to a namespace across multiple events.
   * @param {Function} callback
   *   A function to execute when the relevant event is triggered on the
   *   listening object. The function's `this` object is the listening Box
   *   and it receives any other parameters passed by the trigger call. Usually
   *   an event object is the first parameter, and propagation can be stopped
   *   by calling the event's stopPropagation() method.
   * @param {Number} [weight=0]
   *   An integer indicating the order in which callbacks for the relevant
   *   event should be triggered. Lower numbers cause the callback to get
   *   triggered earlier than higher numbers. This can be useful for getting
   *   around the fact that the canvas doesn't track display order so event
   *   callbacks can't distinguish which object should be triggered first if
   *   multiple listening objects are overlapping.
   */
  once: function(eventName, callback, weight) {
    App.Events.once(this, eventName, callback, weight);
    return this;
  },
  /**
   * Stop listening for a specific event.
   *
   * To listen for an event, use Box#listen() or Box#once().
   *
   * @param {String} eventName
   *   The name of the event for which to listen, e.g. "click." The event can
   *   have a namespace using a dot, e.g. "click.custom" will unbind obj's
   *   listeners for the "click" that are using the "custom" namespace. You can
   *   also unlisten to multiple events using the same namespace, e.g.
   *   ".custom" could unlisten to "mousemove.custom" and "touchmove.custom."
   *   If the event specified does not have a namespace, all callbacks will be
   *   unbound regardless of their namespace.
   */
  unlisten: function(eventName) {
    App.Events.unlisten(this, eventName);
    return this;
  },
  /**
   * Destroy the Box.
   *
   * Override this method to trigger an event when the object is destroyed. For
   * example, this would allow displaying an explosion when a bullet hit a
   * target.
   */
  destroy: function() {},
});

/**
 * A container to keep track of multiple Boxes/Box descendants.
 *
 * @constructor
 *   Creates a new Collection instance.
 *
 * @param {Array} [items]
 *   An Array of Boxes that the Collection should hold.
 */
function Collection(items) {
  this.items = items || [];
}
Collection.prototype = {
  /**
   * Draw every object in the Collection.
   *
   * This calls Box#draw() on every Box in the Collection.
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which to draw. This is useful for drawing
   *   onto {@link Layer}s. If not specified, defaults to the
   *   {@link global#context global context} for the default canvas.
   */
  draw: function(ctx) {
    ctx = ctx || context;
    for (var i = 0; i < this.items.length; i++) {
      this.items[i].draw(ctx);
    }
    return this;
  },
  /**
   * Determine whether any object in this Collection intersects with a Box.
   *
   * @param {Box} box
   *   The Box with which to detect intersection.
   *
   * @return {Boolean} 
   *   true if intersection is detected; false otherwise.
   */
  overlaps: function(box) {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].overlaps(box)) {
        return true;
      }
    }
    return false;
  },
  /**
   * Execute a function on every item in the Collection.
   *
   * @param {Function/String} f
   *   The function to execute on each item, or the (string) name of a method
   *   of each object in the Collection that should be invoked. In the first
   *   case, the function should return a truthy value in order to remove the
   *   item being processed from the Collection. In the second case, additional
   *   arguments to the forEach method are also passed on to the items' method.
   */
  forEach: function(f) {
    if (typeof f == 'string') {
      return this._executeMethod.apply(this, arguments);
    }
    for (var i = this.items.length-1; i >= 0; i--) {
      if (f(this.items[i])) {
        if (this.items[i].destroy instanceof Function) {
          this.items[i].destroy();
        }
        this.items.splice(i, 1);
      }
    }
    return this;
  },
  /**
   * Execute an arbitrary method of all items in the Collection.
   *
   * All items in the Collection are assumed to have the specified method.
   *
   * This is used *internally* by Collection#forEach().
   *
   * @param {String} name
   *    The name of the method to invoke on each object in the Collection.
   * @param {Arguments} ...
   *    Additional arguments are passed on to the specified method.
   *
   * @ignore
   */
  _executeMethod: function(name) {
    Array.prototype.shift.call(arguments);
    for (var i = 0; i < this.items.length; i++) {
      this.items[i][name].apply(this.items[i], arguments);
    }
    return this;
  },
  /**
   * Add an item to the Collection.
   *
   * @param {Box} item
   *   The Box to add to the Collection.
   *
   * @return {Number}
   *   The number of items in the Collection.
   */
  add: function(item) {
    return this.items.push(item);
  },
  /**
   * Add the items in an Array to the Collection.
   *
   * See Collection#combine() to add the items in another Collection to this
   * Collection.
   *
   * @param {Array} items
   *   An Array of Boxes to add to the Collection.
   */
  concat: function(items) {
    this.items = this.items.concat(items);
    return this;
  },
  /**
   * Add the items in another Collection to this Collection.
   *
   * See Collection#concat() to add the items in an Array to this Collection.
   *
   * @param {Collection} otherCollection
   *   A Collection whose items should be added to this Collection.
   */
  combine: function(otherCollection) {
    this.items = this.items.concat(otherCollection.items);
    return this;
  },
  /**
   * Remove an item from the Collection.
   *
   * See Collection#removeLast() to pop the last item in the collection.
   *
   * @param {Box} item
   *   The Box to remove from the Collection.
   *
   * @return Array
   *   An Array containing the removed element, if any.
   */
  remove: function(item) {
    return this.items.remove(item);
  },
  /**
   * Remove and return the last item in the Collection.
   */
  removeLast: function() {
    return this.items.pop();
  },
  /**
   * Return the number of items in the Collection.
   */
  count: function() {
    return this.items.length;
  },
  /**
   * Return an Array containing all items in the Collection.
   */
  getAll: function() {
    return this.items;
  },
  /**
   * Remove all items in the Collection.
   */
  removeAll: function() {
    this.items = [];
    return this;
  },
};

/**
 * A wrapper for image tiles so they can be drawn in the right location.
 *
 * Used *internally* by TileMap as a lighter version of a Box.
 *
 * `src` can be any object of type String (e.g. a file path to an image),
 * Image, HTMLImageElement, HTMLCanvasElement, Sprite, or SpriteMap.
 *
 * @ignore
 */
function ImageWrapper(src, x, y, w, h) {
  this.src = src;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  /**
   * Draws the image.
   */
  this.draw = function() {
    context.drawImage(this.src, this.x, this.y, this.w, this.h);
  };
}

/**
 * A grid of objects (like a 2D {@link Collection}) for easy manipulation.
 *
 * Useful for rapidly initializing and managing large sets of same-sized
 * "tiles."
 *
 * @constructor
 *   Creates a new TileMap instance.
 *
 * @param {String/String[][]} grid
 *   `grid` represents the initial layout of the TileMap. If it is specified as
 *   a 2D Array of Strings, each inner value is used to construct a tile by
 *   using it as a key for the `map` parameter. If it is specified as a single
 *   String, that String is deconstructed into a 2D Array of Strings by
 *   splitting each row at newlines (`\n`) and assuming each character belongs
 *   in its own column. For example, this String:
 *
 *       "    A    \n
 *           BBB   \n
 *        BBBBBBBBB"
 *
 *   is equivalent to this Array:
 *
 *       [[' ', ' ', ' ', ' ', 'A', ' ', ' ', ' ', ' '],
 *        [' ', ' ', ' ', 'B', 'B', 'B', ' ', ' ', ' '],
 *        ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B']]
 *
 *   If `map` was specified as `{'A': Actor, 'B': Box}`, then this layout would
 *   correspond to an Actor standing on top of a small hill of Boxes.
 * @param {Object/Array} map
 *   An Array or object whose keys are found in the `grid` parameter and whose
 *   values are one of the following:
 *
 *   - null: Indicates a blank tile.
 *   - A String object: Assumed to be a path to an image file that should be
 *     used to render the tile.
 *   - An Image, HTMLImageElement, HTMLCanvasElement, {@link Sprite}, or
 *     {@link SpriteMap} object: An image used to render the tile.
 *   - {@link Box}, or a descendant of Box: Passing the literal class
 *     constructor (not an instance) will cause the TileMap to automatically
 *     initialize instances of that class.
 *
 *   This value is irrelevant if `options.gridSize` is specified since the
 *   entire TileMap is then created as a blank grid. However, it must still be
 *   an Object or Array.
 * @param {Object} [options]
 *   A set of configuration settings for the TileMap.
 * @param {Number[]} [options.gridSize=null]
 *   Ignored if null. If this is a two-element Array containing positive
 *   integers, then the TileMap is initialized as a blank grid using these
 *   dimensions (col*row) and the `grid` and `map` parameters become
 *   irrelevant.
 * @param {Number[]} [options.cellSize]
 *   A two-element Array containing positive integers indicating the width and
 *   height in pixels of each tile. Defaults to the default dimensions of a
 *   Box.
 * @param {Number[]} [options.startCoords]
 *   A two-element Array containing positive integers indicating the x- and
 *   y-coordinates of the upper-left corner of the TileMap relative to the
 *   World. Defaults to placing the lower-left corner of the TileMap at the
 *   lower-left corner of the world.
 */
function TileMap(grid, map, options) {
  // Setup and options
  var i, j, l, m;
  this.options = {
      cellSize: [Box.prototype.DEFAULT_WIDTH, Box.prototype.DEFAULT_HEIGHT],
      gridSize: null,
  };
  if (options && options.cellSize instanceof Array && options.cellSize.length > 1) {
    this.options.cellSize = options.cellSize;
  }
  if (options && options.gridSize instanceof Array && options.gridSize.length > 1) {
    this.options.gridSize = options.gridSize;
  }
  // Place the TileMap in the lower-left corner of the world.
  if (typeof this.options.startCoords === 'undefined' ||
      this.options.startCoords.length === 0) {
    this.options.startCoords = [0, world.height - this.options.cellSize[1] *
                                  (typeof grid == 'string' ? grid.split("\n") : grid).length
                                ];
  }
  var gs = this.options.gridSize,
      cw = this.options.cellSize[0],
      ch = this.options.cellSize[1],
      sx = this.options.startCoords[0],
      sy = this.options.startCoords[1];

  // If options.gridSize was specified, build a blank grid.
  if (gs instanceof Array && gs.length > 0) {
    grid = new Array(gs[0]);
    for (i = 0; i < gs[0]; i++) {
      grid[i] = new Array(gs[1]);
      for (j = 0; j < gs[1]; j++) {
        grid[i][j] = null;
      }
    }
  }
  // Allow specifying grid as a string; we'll deconstruct it into an array.
  if (typeof grid == 'string') {
    grid = grid.split("\n");
    for (i = 0, l = grid.length; i < l; i++) {
      grid[i] = grid[i].split('');
    }
  }
  this.grid = grid;
  // Make space mean null (blank) unless otherwise specified.
  if (typeof map !== 'undefined' && typeof map[' '] === 'undefined') {
    map[' '] = null;
  }

  // Initialize all the objects in the grid.
  for (i = 0, l = grid.length; i < l; i++) {
    for (j = 0, m = grid[i].length; j < m; j++) {
      // Avoid errors with map[] and allow writing null directly
      if (grid[i][j] === null) {
        this.grid[i][j] = null;
        continue;
      }
      var o = map ? map[grid[i][j]] : grid[i][j];
      // Blank tile or no match is found in map
      if (o === null || o === undefined) {
        this.grid[i][j] = null;
      }
      else {
        var x = sx + j * cw, y = sy + i * ch; // x- and y-coordinates of tile
        // We can handle any image type that context.drawImage() can draw
        if (typeof o === 'string' ||
            o instanceof Image ||
            o instanceof HTMLImageElement ||
            o instanceof HTMLCanvasElement ||
            o instanceof Sprite ||
            o instanceof SpriteMap ||
            o instanceof Layer) {
          this.grid[i][j] = new ImageWrapper(o, x, y, cw, ch);
        }
        // If we have a Class, initialize a new instance of it
        else if (o instanceof Function) {
          this.grid[i][j] = new (Function.prototype.bind.call(o, null, x, y, cw, ch))();
        }
        else { // fallback
          this.grid[i][j] = null;
        }
      }
    }
  }
  /**
   * Draw all the tiles.
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which to draw the tiles. This is useful
   *   for drawing onto {@link Layer}s. If not specified, defaults to the
   *   {@link global#context global context} for the default canvas.
   * @param {Boolean} [occlude=false]
   *   Indicates whether to only draw tiles that are visible within the
   *   viewport (true) or to draw all tiles (false). Drawing only visible tiles
   *   is performance-friendly for huge TileMaps, but requires re-drawing the
   *   TileMap whenever the viewport scrolls. If you are just drawing the
   *   TileMap once, for example onto a background Layer cache, occluding is
   *   unnecessary.
   * @param {Boolean} [smooth]
   *   Indicates whether to force the Box to be drawn at whole-pixel
   *   coordinates. If you don't already know that your coordinates
   *   will be integers, this option can speed up painting since the browser
   *   does not have to interpolate the image. Defaults to whatever the default
   *   is for each object being drawn (the default for Boxes is true).
   */
  this.draw = function(ctx, occlude, smooth) {
    ctx = ctx || context;
    var i, l;
    if (occlude) {
      var active = this.getCellsInRect();
      for (i = 0, l = active.length; i < l; i++) {
        active[i].draw(ctx, smooth);
      }
      return;
    }
    for (i = 0, l = this.grid.length; i < l; i++) {
      for (var j = 0, m = this.grid[i].length; j < m; j++) {
        var o = this.grid[i][j];
        if (o !== null) {
          o.draw(ctx, smooth);
        }
      }
    }
    return this;
  };
  /**
   * Get the object at a specific tile using the row and column.
   *
   * @param {Number} row The row of the tile being retrieved.
   * @param {Number} col The column of the tile being retrieved.
   * @return {Mixed} The object at the specified tile.
   */
  this.getCell = function(row, col) {
    return this.grid[row] ? this.grid[row][col] : undefined;
  };
  /**
   * Place a specific object into a specific tile using the row and column.
   *
   * If an object is already located there, it will be overwritten.
   *
   * Note that placing an object into a specific cell does not adjust its
   * position, but rather merely stores it in the TileMap. If you want an
   * object to appear at a specific position relative to other tiles, you need
   * to place it there yourself.
   *
   * @param {Number} row The row of the tile being set.
   * @param {Number} col The column of the tile being set.
   * @param {Object} obj The object to place at the specified tile.
   */
  this.setCell = function(row, col, obj) {
    if (this.grid[row] && typeof this.grid[row][col] !== 'undefined') {
      this.grid[row][col] = obj;
    }
    return this;
  };
  /**
   * Clear a specific tile (make it blank).
   *
   * @param {Number} row The row of the tile being cleared.
   * @param {Number} col The column of the tile being cleared.
   */
  this.clearCell = function(row, col) {
    if (this.grid[row] && typeof this.grid[row][col] !== 'undefined') {
      this.grid[row][col] = null;
    }
    return this;
  };
  /**
   * Return an Array of all non-null objects in the TileMap.
   *
   * For large TileMaps, consider using TileMap#getCellsInRect() for
   * efficiency, since it only returns cells within a certain area (the
   * viewport by default).
   *
   * Note that if you just used a TileMap to easily initialize a bunch of
   * tiles, or if you're not adding or removing tiles frequently but you are
   * calling this function frequently, you can also convert your TileMap to a
   * {@link Collection}:
   *
   *     var myCollection = new Collection(myTileMap.getAll());
   *
   * This is more efficient if you always need to process every item in the
   * TileMap and you don't care about their relative position.
   */
  this.getAll = function() {
    var w = this.grid.length, h = (w > 0 ? this.grid[0].length : 0), r = [], i, j;
    for (i = 0; i < w; i++) {
      for (j = 0; j < h; j++) {
        if (this.grid[i][j] !== null) {
          r.push(this.grid[i][j]);
        }
      }
    }
    return r;
  };
  /**
   * Clear all tiles (make them blank).
   */
  this.clearAll = function() {
    var w = this.grid.length, h = (w > 0 ? this.grid[0].length : 0), i, j;
    this.grid = new Array(w);
    for (i = 0; i < w; i++) {
      this.grid[i] = new Array(h);
      for (j = 0; j < h; j++) {
        grid[i][j] = null;
      }
    }
    return this;
  };
  /**
   * Get the number of rows in the grid.
   *
   * See also TileMap#getCols().
   */
  this.getRows = function() {
    return this.grid.length;
  };
  /**
   * Get the number of columns in the grid.
   *
   * See also TileMap#getRows().
   */
  this.getCols = function() {
    return this.grid.length > 0 ? this.grid[0].length : 0;
  };
  /**
   * Execute a function on every element in the TileMap.
   *
   * @param {Function} f
   *   The function to execute on each tile.
   * @param {Mixed} f.obj
   *   The object being processed.
   * @param {Number} f.row
   *   The row of the tile being processed. This lets the function use
   *   TileMap#getCell() if it needs to check surrounding cells.
   * @param {Number} f.col
   *   The column of the tile being processed. This lets the function use
   *   TileMap#getCell() if it needs to check surrounding cells.
   * @param {Boolean} f.return
   *   If the return value is truthy, the object being processed will be
   *   removed from the TileMap. If it has a destroy() method, that method will
   *   be called.
   * @param {Boolean} [includeNull=false]
   *   Indicates whether to execute the function on null (blank) tiles.
   */
  this.forEach = function(f, includeNull) {
    var w = this.grid.length, h = (w > 0 ? this.grid[0].length : 0), i, j;
    for (i = 0; i < w; i++) {
      for (j = 0; j < h; j++) {
        if (this.grid[i][j] !== null || includeNull) {
          if (f(this.grid[i][j], i, j)) {
            if (this.grid[i][j].destroy instanceof Function) {
              this.grid[i][j].destroy();
            }
            this.clearCell(i, j);
          }
        }
      }
    }
    return this;
  };
  /**
   * Get the max and min array coordinates of cells that are in a rectangle.
   *
   * wx and wy are the x- and y-coordinates in pixels of the upper-left corner
   * of the rectangle to retrieve, respectively. tw and th are the width and
   * height in pixels of the rectangle, respectively. This function returns an
   * Array containing the starting column, starting row, ending column, and
   * ending row of the TileMap grid that fall within the specified pixel
   * rectangle. These values may be outside of the actual bounds of the TileMap
   * grid. This function is only called *internally* (from
   * TileMap#getCellsInRect(), which restricts the returned values to the
   * bounds of the TileMap grid).
   *
   * @ignore
   */
  this._getCellCoordsInRect = function(wx, wy, tw, th) {
    if (typeof wx === 'undefined') wx = world.xOffset;
    if (typeof wy === 'undefined') wy = world.yOffset;
    if (typeof tw === 'undefined') tw = canvas.width;
    if (typeof th === 'undefined') th = canvas.height;
    var x = this.options.startCoords[0], y = this.options.startCoords[1];
    var cw = this.options.cellSize[0], cy = this.options.cellSize[1];
    var sx = (wx - x) / cw, sy = (wy - y) / cy;
    var sxe = (wx + tw - x) / cw, sye = (y - wy + th) / cy;
    // startCol, startRow, endCol, endRow
    return [Math.floor(sx), Math.floor(sy), Math.ceil(sxe), Math.ceil(sye)];
  };
  /**
   * Return all objects within a given rectangle.
   *
   * This method returns an array of all non-null objects in the TileMap within
   * a rectangle specified in pixels. If no rectangle is specified, this method
   * defaults to retrieving all objects in view (i.e. it uses the viewport as
   * the rectangle).
   *
   * This is an efficient way to process only objects that are in view (or
   * nearly in view) which is useful for efficient processing of only relevant
   * information in a very large map.
   *
   * Use TileMap#getAll() to process every tile in a TileMap.
   *
   * @param {Number} [x]
   *   The x-coordinate in pixels of the upper-left corner of the rectangle
   *   to retrieve. Defaults to the upper-left corner of the viewport.
   * @param {Number} [y]
   *   The y-coordinate in pixels of the upper-left corner of the rectangle
   *   to retrieve. Defaults to the upper-left corner of the viewport.
   * @param {Number} [w]
   *   The width of the rectangle to retrieve. Defaults to the width of the
   *   viewport.
   * @param {Number} [h]
   *   The height of the rectangle to retrieve. Defaults to the height of the
   *   viewport.
   *
   * @return {Array}
   *   All non-null objects in the TileMap within the specified rectangle.
   */
  this.getCellsInRect = function(x, y, w, h) {
    // startCol, startRow, endCol, endRow
    var r = this._getCellCoordsInRect(x, y, w, h), s = [];
    var startRow = Math.min(this.getRows(), Math.max(0, r[1]));
    var endRow = Math.min(this.getRows(), Math.max(0, r[3]));
    var startCol = Math.min(this.getCols(), Math.max(0, r[0]));
    var endCol = Math.min(this.getCols(), Math.max(0, r[2]));
    for (var i = startRow, l = endRow; i < l; i++) {
      for (var j = startCol, m = endCol; j < m; j++) {
        if (this.grid[i][j] !== null) {
          s.push(this.grid[i][j]);
        }
      }
    }
    return s;
  };
}

/**
 * The World object.
 * 
 * The World represents the complete playable game area. Its size can be set
 * explicitly or is automatically determined by the "data-worldwidth" and
 * "data-worldheight" attributes set on the HTML canvas element (with a
 * fallback to the canvas width and height). If the size of the world is larger
 * than the canvas then by default the view of the world will scroll when the
 * {@link global#player player} approaches a side of the canvas.
 * 
 * @param {Number} [w]
 *   The width of the world. Defaults to the value of the "data-worldwidth"
 *   attribute on the HTML canvas element, or (if that attribute is not
 *   present) the width of the canvas element.
 * @param {Number} [h]
 *   The height of the world. Defaults to the value of the "data-worldheight"
 *   attribute on the HTML canvas element, or (if that attribute is not
 *   present) the height of the canvas element.
 */
function World(w, h) {
  /**
   * @property {Number} scale
   *   The percent amount (as a fraction) the canvas resolution is scaled.
   */
  this.scale = 1;
  /**
   * @property {Number} width
   *   The width of the world.
   */
  this.width = w || parseInt($canvas.attr('data-worldwidth'), 10) || canvas.width;
  /**
   * @property {Number} height
   *   The height of the world.
   */
  this.height = h || parseInt($canvas.attr('data-worldheight'), 10) || canvas.height;

  /**
   * @property {Number} xOffset
   *   The pixel-offset of what's being displayed in the canvas compared to the
   *   world origin.
   */
  this.xOffset = (this.width - canvas.width)/2;
  /**
   * @property {Number} yOffset
   *   The pixel-offset of what's being displayed in the canvas compared to the
   *   world origin.
   */
  this.yOffset = (this.height - canvas.height)/2;
  context.translate(-this.xOffset, -this.yOffset);

  /**
   * Return an object with 'x' and 'y' properties indicating how far offset
   * the viewport is from the world origin.
   */
  this.getOffsets = function() {
    return {
      'x': this.xOffset,
      'y': this.yOffset,
    };
  };

  /**
   * Resize the world to new dimensions.
   *
   * Careful! This will shift the viewport regardless of where the player is.
   * Objects already in the world will retain their coordinates and so may
   * appear in unexpected locations on the screen.
   *
   * @param {Number} newWidth The new width to which to resize the world.
   * @param {Number} newHeight The new height to which to resize the world.
   */
  this.resize = function(newWidth, newHeight) {
    // Try to re-center the offset of the part of the world in the canvas
    // so we're still looking at approximately the same thing.
    var deltaX = (newWidth - this.width) / 2, deltaY = (newHeight - this.height) / 2;
    this.xOffset += deltaX;
    this.yOffset += deltaY;
    context.translate(-deltaX, -deltaY);
    
    // Change the world dimensions.
    this.width = newWidth;
    this.height = newHeight;
    
    /**
     * @event resizeWorld
     *   Broadcast that the world size changed so that objects already in the
     *   world or other things that depend on the world size can update their
     *   position or size accordingly.
     * @param {Number} x How far in pixels the viewport shifted horizontally.
     * @param {Number} y How far in pixels the viewport shifted vertically.
     * @param {World} resizedWorld The world that changed size.
     */
    jQuery(document).trigger('resizeWorld', [deltaX, deltaY, this]);
  };

  /**
   * Scale the canvas resolution.
   *
   * Passing a factor smaller than 1 allows reducing the resolution of the
   * canvas, which should improve performance (since there is less to render in
   * each frame). It does not actually change the size of the canvas on the
   * page; it just scales how big each "pixel" is drawn on the canvas, much
   * like changing the resolution of your monitor does not change its physical
   * size. It is your responsibility to change the size of any fixed-size
   * entities in the world after resizing, if applicable; if you don't do this,
   * calling this function works much like zooming in or out.
   *
   * You may want to call this in a listener for the
   * {@link global#low_fps Low FPS event}.
   *
   * @param {Number} factor
   *   The percent amount to scale the resolution on each dimension as a
   *   fraction of the <em>current</em> resolution (typically between zero and
   *   one). In other words, if the original resolution is 1024*768, scaling
   *   the resolution by a factor of 0.5 will result in a resolution of 512*384
   *   (showing 25% as many pixels on the screen). If scaled again by a factor
   *   of 2, the result is 1024*768 again. Use the `scale` property to detect
   *   the factor by which the resolution is currently scaled.
   * @param {Number} [x=0]
   *   The x-coordinate of a location to center the viewport around after
   *   resizing the canvas. A common use is `player.x`.
   * @param {Number} [y=0]
   *   The y-coordinate of a location to center the viewport around after
   *   resizing the canvas. A common use is `player.y`.
   */
  this.scaleResolution = function(factor, x, y) {
    $canvas.css({
      width: (canvas.width/this.scale) + 'px',
      height: (canvas.height/this.scale) + 'px',
    });
    canvas.width = (canvas.width*factor)|0;
    canvas.height = (canvas.height*factor)|0;
    x = x || 0;
    y = y || 0;
    this.xOffset = Math.min(this.width - canvas.width, Math.max(0, x - canvas.width / 2)) | 0;
    this.yOffset = Math.min(this.height - canvas.height, Math.max(0, y - canvas.height / 2)) | 0;
    context.translate(-this.xOffset, -this.yOffset);
    this.scale = factor;
    if (!isAnimating()) {
      draw();
    }
  };

  /**
   * Center the viewport around a specific location.
   *
   * @param {Number} x The x-coordinate around which to center the viewport.
   * @param {Number} y The y-coordinate around which to center the viewport.
   */
  this.centerViewportAround = function(x, y) {
    var newXOffset = Math.min(this.width - canvas.width, Math.max(0, x - canvas.width / 2)) | 0,
        newYOffset = Math.min(this.height - canvas.height, Math.max(0, y - canvas.height / 2)) | 0,
        deltaX = this.xOffset - newXOffset,
        deltaY = this.yOffset - newYOffset;
    this.xOffset = newXOffset;
    this.yOffset = newYOffset;
    context.translate(deltaX, deltaY);
  };

  /**
   * Determine whether a Box is inside the viewport.
   *
   * To test whether a Box is inside the World, see World#isInWorld().
   *
   * @param {Box} box
   *   The Box object to check for visibility.
   * @param {Boolean} [partial=false]
   *   Indicates whether to consider the Box inside the viewport if it is only
   *   partially inside (true) or fully inside (false).
   *
   * @return {Boolean}
   *   true if the Box is inside the viewport; false otherwise.
   */
  this.isInView = function(box, partial) {
    if (partial) {
      return box.x + box.width > this.xOffset &&
        box.x < this.xOffset + canvas.width &&
        box.y + box.height > this.yOffset &&
        box.y < this.yOffset + canvas.height;
    }
    return box.x > this.xOffset &&
      box.x + box.width < this.xOffset + canvas.width &&
      box.y > this.yOffset &&
      box.y + box.height < this.yOffset + canvas.height;
  };

  /**
   * Determine whether a Box is inside the world.
   *
   * To test whether a Box is inside the viewport, see World#isInView().
   *
   * @param {Box} box
   *   The Box object to check.
   * @param {Boolean} [partial=false]
   *   Indicates whether to consider the box inside the world if it is only
   *   partially inside (true) or fully inside (false).
   *
   * @return {Boolean}
   *   true if the Box is inside the world; false otherwise.
   */
  this.isInWorld = function(box, partial) {
    if (partial) {
      return box.x + box.width >= 0 && box.x <= world.width &&
        box.y + box.height >= 0 && box.y <= world.height;
    }
    return box.x >= 0 && box.x + box.width <= world.width &&
      box.y >= 0 && box.y + box.height <= world.height;
  };
}

/**
 * The Layer object (basically a new, utility canvas).
 *
 * Layers allow efficient rendering of complex scenes by acting as caches for
 * parts of the scene that are grouped together. For example, it is recommended
 * to create a Layer for your canvas's background so that you can render the
 * background once and then draw the completely rendered background onto the
 * main canvas in each frame instead of re-computing the background for each
 * frame. This can significantly speed up animation.
 *
 * In general you should create a layer for any significant grouping of items
 * if that grouping moves together when animated. It is more memory-efficient
 * to specify a smaller layer size if possible; otherwise the layer will
 * default to the size of the whole canvas.
 *
 * Draw onto a Layer by using its "context" property, which is a
 * {@link CanvasRenderingContext2D canvas graphics context}.
 *
 * @param {Object} [options]
 *   A set of options.
 * @param {Number} [options.x=0]
 *   The x-coordinate of the top-left corner of the Layer.
 * @param {Number} [options.y=0]
 *   The y-coordinate of the top-left corner of the Layer.
 * @param {Number} [options.width]
 *   The width of the Layer.
 * @param {Number} [options.height]
 *   The height of the Layer.
 * @param {"world"/"canvas"} [options.relative="world"]
 *   Indicates what to draw the Layer relative to:
 *
 *   - 'world': Draw the layer relative to the world so that it will appear
 *     to be in one specific place as the player or viewport moves.
 *   - 'canvas': Draw the layer relative to the canvas so that it stays fixed
 *     as the player moves. This is useful for a HUD, for example.
 *
 *   This option is irrelevant if the world is the same size as the canvas.
 * @param {Number} [options.opacity=1]
 *   A fractional percentage [0, 1] indicating the opacity of the Layer.
 *   0 (zero) means fully transparent; 1 means fully opaque. This value is
 *   applied when {@link Layer#draw drawing} the layer.
 * @param {Number} [options.parallax=1]
 *   A fractional percentage indicating how much to {@link Layer#scroll scroll}
 *   the Layer relative to the viewport's movement.
 * @param {Mixed} [options.src]
 *   Anything that can be passed to the `src` parameter of
 *   {@link CanvasRenderingContext2D#drawImage drawImage()}. This will be used
 *   to draw an image stretched over the whole Layer as a convenience.
 * @param {HTMLElement} [options.canvas]
 *   A Canvas element in which to hold the Layer. If not specified, a new,
 *   invisible canvas is created. Careful; if width and height are specified,
 *   the canvas will be resized (and therefore cleared). This is mainly for
 *   internal use.
 */
function Layer(options) {
  options = options || {};
  /**
   * @property {HTMLElement} canvas
   *   The canvas backing the Layer.
   * @readonly
   */
  this.canvas = options.canvas || document.createElement('canvas');
  /**
   * @property {CanvasRenderingContext2D} context
   *   The Layer's graphics context. Use this to draw onto the Layer.
   * @readonly
   */
  this.context = this.canvas.getContext('2d');
  this.context.__layer = this;
  /**
   * @property {Number} width
   *   The width of the Layer.
   * @readonly
   */
  this.width = options.width || world.width || canvas.width;
  /**
   * @property {Number} height
   *   The height of the Layer.
   * @readonly
   */
  this.height = options.height || world.height || canvas.height;
  /**
   * @property {Number} x
   *   The x-coordinate on the {@link global#canvas global canvas} of the
   *   upper-left corner of the Layer.
   */
  this.x = options.x || 0;
  /**
   * @property {Number} y
   *   The y-coordinate on the {@link global#canvas global canvas} of the
   *   upper-left corner of the Layer.
   */
  this.y = options.y || 0;
  /**
   * @property {"world"/"canvas"} relative
   *   What to draw the Layer relative to.
   */
  this.relative = options.relative || 'world';
  /**
   * @property {Number} opacity
   *   A fractional percentage [0, 1] indicating the opacity of the Layer.
   *   0 (zero) means fully transparent; 1 means fully opaque. This value is
   *   applied when {@link Layer#draw drawing} the layer.
   */
  this.opacity = options.opacity || 1;
  /**
   * @property {Number} parallax
   *   A fractional percentage indicating how much to
   *   {@link Layer#scroll scroll} the Layer relative to the viewport's
   *   movement.
   */
  this.parallax = options.parallax || 1;
  this.canvas.width = this.width;
  this.canvas.height = this.height;
  /**
   * @property {Number} xOffset
   *   The horizontal distance in pixels that the Layer has
   *   {@link Layer#scroll scrolled}.
   */
  this.xOffset = 0;
  /**
   * @property {Number} yOffset
   *   The vertical distance in pixels that the Layer has
   *   {@link Layer#scroll scrolled}.
   */
  this.yOffset = 0;
  if (options.src) {
    this.context.drawImage(options.src, 0, 0, this.width, this.height);
  }
  /**
   * Draw the Layer.
   *
   * This method can be invoked in two ways:
   *
   * - `draw(x, y)`
   * - `draw(ctx, x, y)`
   *
   * All parameters are optional either way.
   *
   * @param {CanvasRenderingContext2D} [ctx]
   *   A canvas graphics context onto which this Layer should be drawn. This is
   *   useful for drawing onto other Layers. If not specified, defaults to the
   *   {@link global#context global context} for the default canvas.
   * @param {Number} [x]
   *   An x-coordinate on the canvas specifying where to draw the upper-left
   *   corner of the Layer. The actual position that the coordinate equates to
   *   depends on the value of the
   *   {@link Layer#relative Layer's "relative" property}. Defaults to the
   *   {@link Layer#x Layer's "x" property} (which defaults to 0 [zero]).
   * @param {Number} [y]
   *   A y-coordinate on the canvas specifying where to draw the upper-left
   *   corner of the Layer. The actual position that the coordinate equates to
   *   depends on the value of the
   *   {@link Layer#relative Layer's "relative" property}. Defaults to the
   *   {@link Layer#y Layer's "y" property} (which defaults to 0 [zero]).
   */
  this.draw = function(ctx, x, y) {
    if (!(ctx instanceof CanvasRenderingContext2D)) {
      y = x;
      x = ctx;
      ctx = context;
    }
    x = typeof x === 'undefined' ? this.x : x;
    y = typeof y === 'undefined' ? this.y : y;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    if (this.relative == 'canvas') {
      ctx.translate(world.xOffset, world.yOffset);
    }
    if (this.xOffset || this.yOffset) {
      ctx.translate(this.xOffset, this.yOffset);
    }
    ctx.drawImage(this.canvas, x, y);
    ctx.restore();
    return this;
  };
  /**
   * Clear the layer, optionally by filling it with a given style.
   *
   * @param {Mixed} [fillStyle]
   *   A canvas graphics context fill style. If not passed, the Layer will
   *   simply be cleared. If passed, the Layer will be filled with the given
   *   style.
   */
  this.clear = function(fillStyle) {
    this.context.clear(fillStyle);
    return this;
  };
  /**
   * Scroll the Layer.
   *
   * @param {Number} x
   *   The horizontal distance the target has shifted.
   * @param {Number} y
   *   The vertical distance the target has shifted.
   * @param {Number} [p]
   *   The parallax factor. Defaults to {@link Layer#parallax this.parallax}.
   */
  this.scroll = function(x, y, p) {
    p = p || this.parallax;
    this.xOffset += -x*p;
    this.yOffset += -y*p;
    return this;
  };
  /**
   * Display this Layer's canvas in an overlay (for debugging purposes).
   *
   * Clicking the overlay will remove it.
   *
   * @return {HTMLElement}
   *   A jQuery representation of a div containing the canvas holding the
   *   Layer.
   */
  this.showCanvasOverlay = function() {
    stopAnimating();
    var $d = jQuery('<div></div>');
    $d.css({
      cursor: 'pointer',
      display: 'block',
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%',
    });
    var $c = jQuery(this.canvas);
    $c.css({
      border: '1px solid black',
      display: 'block',
      margin: '0 auto',
      position: 'absolute',
      'z-index': 100,
    }).click(function() {
      $d.remove();
      startAnimating();
    });
    $d.append($c);
    jQuery('body').append($d);
    $d.click(function(e) {
      if (e.which != 3) { // Don't intercept right-click events
        $d.remove();
      }
    });
    return $d;
  };
}

/**
 * Actors are {@link Box Boxes} that can move.
 *
 * @extends Box
 */
var Actor = Box.extend({

  /**
   * The velocity the Actor can move in pixels per second.
   */
  MOVEAMOUNT: 400,

  /**
   * Whether gravity (downward acceleration) is enabled.
   *
   * This is effectively a toggle between a top-down and side view.
   */
  GRAVITY: false,

  /**
   * Gravitational acceleration in pixels per second-squared.
   *
   * Has no effect if GRAVITY is false. Setting to 0 (zero) has a similar
   * physical effect to disabling gravity.
   */
  G_CONST: 21,

  /**
   * Jump velocity (impulse) in pixels per second.
   *
   * Has no effect if GRAVITY is false. Set to 0 (zero) to disable jumping.
   */
  JUMP_VEL: 500,

  /**
   * The minimum number of seconds required between jumps.
   *
   * Has no effect if GRAVITY is false or JUMP_VEL is 0 (zero).
   */
  JUMP_DELAY: 0.25,

  /**
   * Percent of normal horizontal velocity Actors can move while in the air.
   *
   * Note that if Actors are moving horizontally before jumping, they keep
   * moving at the same speed in the air; in this case air control only takes
   * effect if they switch direction mid-air. Otherwise, air control only
   * applies if they started moving horizontally after they entered the air.
   */
  AIR_CONTROL: 0.25,

  /**
   * Whether to require that the jump key is released before jumping again.
   *
   * Specifically, this is a boolean which, when true, restricts the Actor from
   * jumping after being in the air until after the Actor is on the ground with
   * the jump key released. This limits the ability to "bounce" by holding down
   * the jump key. This behavior depends on being notified of when keys are
   * released via the release() method, which happens automatically for
   * Players. If you enable this for standard Actors, the meaning of a "key
   * press" is artificial, so you must make sure to call release() before you
   * make the Actor jump again.
   */
  JUMP_RELEASE: false,

  /**
   * The number of times an Actor can jump without touching the ground.
   *
   * -1 allows the Actor to jump in the air an infinite number of times. A
   * value of zero is the same as a value of one (i.e. a value of zero will not
   * stop the Actor from having one jump).
   */
  MULTI_JUMP: 0,

  /**
   * Whether to make the Actor continue moving in the last direction specified.
   */
  CONTINUOUS_MOVEMENT: false,

  /**
   * Whether the Actor will be restricted to not move outside the world.
   */
  STAY_IN_WORLD: true,

  /**
   * The fractional velocity damping factor.
   *
   * If set, this affects whether the Actor can turn on a dime or how much it
   * slides around. Higher means more movement control (less sliding).
   *
   * If you want specific surfaces to feel slippery, set this when the Actor
   * moves onto and off of those surfaces.
   *
   * Numeric values are interpreted as damping factors. If this is null, full
   * damping is applied (the Actor stops and turns on a dime).
   *
   * Damping does not affect vertical movement when gravity is enabled.
   */
  DAMPING_FACTOR: null,

  /**
   * The last direction (key press) that resulted in looking in a direction.
   *
   * If GRAVITY is enabled, this Array will only contain left or right keys.
   * This is because left/right+up/down is a valid direction but does not
   * result in looking diagonally.
   */
  lastLooked: [],

  /**
   * Whether the Actor is being mouse-dragged.
   * @readonly
   */
  isBeingDragged: false,

  /**
   * A {@link Collection} of target Boxes onto which this Actor can be dropped.
   *
   * You must call Actor#setDraggable(true) to enable dragging the Actor.
   *
   * Drop targets can change how they look when a draggable object is hovered
   * over them by testing `this.isHovered() && App.isSomethingBeingDragged` in
   * their {@link Box#draw draw()} methods. They can change how they look or
   * perform some action when a draggable object is dropped onto them by
   * listening for the {@link Box#event-canvasdrop canvasdrop event}.
   */
  dropTargets: new Collection(),

  /**
   * The horizontal component of the velocity.
   *
   * Use Actor#getVelocityVector() if you want to get velocity as a vector.
   */
  xVelocity: 0,

  /**
   * The vertical component of the velocity.
   *
   * Use Actor#getVelocityVector() if you want to get velocity as a vector.
   */
  yVelocity: 0,

  /**
   * The horizontal component of the acceleration.
   *
   * Use Actor#getAccelerationVector() if you want to get acceleration as a
   * vector.
   */
  xAcceleration: 0,

  /**
   * The vertical component of the acceleration.
   *
   * Use Actor#getAccelerationVector() if you want to get acceleration as a
   * vector.
   */
  yAcceleration: 0,

  // Dynamic (internal) variables
  lastJump: 0, // Time when the last jump occurred in milliseconds since the epoch
  lastDirection: [], // The last direction (i.e. key press) passed to processInput()
  jumpDirection: {right: false, left: false}, // Whether the Actor was moving horizontally before jumping
  jumpKeyDown: false, // Whether the jump key is currently pressed
  numJumps: 0, // Number of jumps since the last time the Actor was touching the ground
  inAir: false, // Whether the Actor is in the air
  fallLeft: null, // The direction the Actor was moving before falling
  isDraggable: false, // Whether the Actor is draggable
  dragStartX: 0, // Last position of the Actor before being dragged
  dragStartY: 0, // Last position of the Actor before being dragged

  /**
   * @constructor
   *   Initialize an Actor.
   *
   * Takes the same parameters as the Box constructor.
   * **Inherited documentation:**
   *
   * @inheritdoc Box#constructor
   */
  init: function() {
    this._super.apply(this, arguments);
    this.lastX = this.x;
    this.lastY = this.y;
    this.lastDirection = [];
    this.lastLooked = [];
    this.jumpDirection = {right: false, left: false};
  },

  /**
   * Actors draw as a smiley face by default.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Box#drawDefault
   */
  drawDefault: function(ctx, x, y, w, h) {
    ctx.drawSmiley(x + w/2, y + h/2, (w+h)/4);
  },

  /**
   * Update the Actor for a new frame.
   *
   * @param {String[]} [direction]
   *   An Array of directions in which to move the Actor. Directions are
   *   expected to correspond to keys on the keyboard (as described by
   *   {@link jQuery.hotkeys}).
   */
  update: function(direction) {
    this.lastX = this.x;
    this.lastY = this.y;
    if (this.isBeingDragged) {
      this.x = Mouse.coords.x + world.xOffset - this.width/2;
      this.y = Mouse.coords.y + world.yOffset - this.height/2;
    }
    else {
      this.processInput(direction);
      this.ambientAcceleration();
      this.move();
      if (App.Utils.almostEqual(this.lastX, this.x, 0.000001)) {
        this.fallLeft = null;
      }
    }
    this.updateAnimation();
    this.dampVelocity();
  },

  /**
   * Process directions and adjust motion accordingly.
   *
   * Called from Actor#update().
   *
   * @param {String[]} direction
   *   An Array of directions in which to move the Actor. Valid directions are
   *   expected to correspond to keys on the keyboard by default (as described
   *   by {@link jQuery.hotkeys}) though for Actors that are not Players the
   *   directions will not normally be sent from actual key presses.
   */
  processInput: function(direction) {
    var left = false,
        right = false,
        looked = false,
        anyIn = App.Utils.anyIn;
    // Bail if someone deleted the keys variable.
    if (typeof keys === 'undefined') {
      return;
    }
    if (typeof direction === 'undefined' || direction.length === 0) {
      // For continuous movement, if no direction is given, use the last one.
      if (this.CONTINUOUS_MOVEMENT) {
        direction = this.lastLooked;
      }
      // No need to keep processing if no directions were given.
      else {
        return;
      }
    }
    this.lastDirection = direction.slice(); // shallow copy

    // Move left.
    if (anyIn(keys.left, direction)) {
      left = true;
      looked = true;
      this.fallLeft = true;
      if (this.GRAVITY && this.isInAir()) {
        if (this.jumpDirection.right || !this.jumpDirection.left) {
          this.xVelocity = -this.MOVEAMOUNT * this.AIR_CONTROL;
          this.jumpDirection.right = false;
          this.jumpDirection.left = false;
        }
      }
      else {
        this.xVelocity = -this.MOVEAMOUNT;
      }
    }
    // Move right.
    else if (anyIn(keys.right, direction)) {
      right = true;
      looked = true;
      this.fallLeft = false;
      if (this.GRAVITY && this.isInAir()) {
        if (this.jumpDirection.left || !this.jumpDirection.right) {
          this.xVelocity = this.MOVEAMOUNT * this.AIR_CONTROL;
          this.jumpDirection.right = false;
          this.jumpDirection.left = false;
        }
      }
      else {
        this.xVelocity = this.MOVEAMOUNT;
      }
    }

    // Move up / jump.
    if (anyIn(keys.up, direction)) {
      if (!this.GRAVITY) {
        this.yVelocity = -this.MOVEAMOUNT;
        looked = true;
      }
      else if (!this.isInAir() ||
          this.MULTI_JUMP > this.numJumps ||
          this.MULTI_JUMP == -1) {
        var now = App.physicsTimeElapsed;
        if (now - this.lastJump > this.JUMP_DELAY && // sufficient delay
            (!this.JUMP_RELEASE || !this.jumpKeyDown)) { // press jump again
          this.yVelocity = -this.JUMP_VEL;
          this.lastJump = now;
          this.jumpDirection.right = right;
          this.jumpDirection.left = left;
          this.numJumps++;
          this.inAir = true;
        }
      }
      this.jumpKeyDown = true;
    }
    // Move down.
    else if (anyIn(keys.down, direction)) {
      if (!this.isInAir() || !this.GRAVITY) { // don't allow accelerating downward when falling
        this.yVelocity = this.MOVEAMOUNT;
        looked = true;
      }
    }

    if (looked) {
      this.lastLooked = direction.slice(); // shallow copy
      // Avoid looking anywhere but right or left if gravity is enabled.
      // If we didn't have this here, we would be able to look diagonally.
      if (this.GRAVITY) {
        for (var i = this.lastLooked.length-1; i >= 0; i--) {
          if (keys.left.indexOf(this.lastLooked[i]) == -1 &&
              keys.right.indexOf(this.lastLooked[i]) == -1) {
            this.lastLooked.splice(i, 1);
          }
        }
      }
    }
  },

  /**
   * Calculate acceleration from the environment.
   *
   * Acceleration from user input is calculated in Actor#processInput().
   */
  ambientAcceleration: function() {
    // Gravity.
    if (this.GRAVITY) {
      // Air movement (not initiated by user input).
      if (this.isInAir()) {
        this.yAcceleration += this.G_CONST;
        if (this.jumpDirection.left) {
          this.xVelocity = -this.MOVEAMOUNT;
        }
        else if (this.jumpDirection.right) {
          this.xVelocity = this.MOVEAMOUNT;
        }
      }
      else {
        this.stopFalling();
      }
    }
  },

  /**
   * Actually move the Actor.
   */
  move: function() {
    var delta = App.physicsDelta, d2 = delta / 2;
    // Apply half acceleration (first half of midpoint formula)
    this.xVelocity += this.xAcceleration*d2;
    this.yVelocity += this.yAcceleration*d2;
    // Don't let diagonal movement be faster than axial movement
    var xV = this.xVelocity, yV = this.yVelocity;
    if (xV !== 0 && yV !== 0 && !this.GRAVITY) {
      var magnitude = Math.max(Math.abs(xV), Math.abs(yV));
      var origMag = Math.sqrt(xV*xV + yV*yV);
      var scale = magnitude / origMag;
      this.xVelocity *= scale;
      this.yVelocity *= scale;
    }
    // Apply thrust
    this.x += this.xVelocity*delta;
    this.y += this.yVelocity*delta;
    // Apply half acceleration (second half of midpoint formula)
    this.xVelocity += this.xAcceleration*d2;
    this.yVelocity += this.yAcceleration*d2;
    // Clip
    this.stayInWorld();
  },

  /**
   * Force the Actor to stay inside the world.
   */
  stayInWorld: function() {
    if (this.STAY_IN_WORLD) {
      if (this.x < 0) {
        this.x = 0;
      }
      else if (this.x + this.width > world.width) {
        this.x = world.width - this.width;
      }
      if (this.y < 0) {
        this.y = 0;
      }
      else if (this.y + this.height > world.height) {
        this.y = world.height - this.height;
        this.stopFalling();
      }
    }
  },

  /**
   * Damp the Actor's velocity.
   *
   * This affects how much control the Actor has over its movement, i.e.
   * whether the Actor can stop and turn on a dime or whether it slides around
   * with momentum.
   */
  dampVelocity: function() {
    if (this.DAMPING_FACTOR !== null &&
        !App.Utils.almostEqual(this.xVelocity, 0, 0.0001)) {
      this.xVelocity *= 1 - this.DAMPING_FACTOR * App.physicsDelta;
      if (!this.GRAVITY && !App.Utils.almostEqual(this.yVelocity, 0, 0.0001)) {
        this.yVelocity *= 1 - this.DAMPING_FACTOR * App.physicsDelta;
      }
      return;
    }
    this.xVelocity = 0;
    if (!this.GRAVITY) {
      this.yVelocity = 0;
    }
  },

  /**
   * Add velocity as a vector.
   *
   * See also Actor#setVelocityVector() and Actor#getVelocityVector().
   *
   * @param {Number} radialDir The direction of the vector to add, in radians.
   * @param {Number} magnitude The magnitude ot the vector to add, in pixels.
   */
  addVelocityVector: function(radialDir, magnitude) {
    this.xVelocity += magnitude * Math.cos(radialDir);
    this.yVelocity += magnitude * Math.sin(radialDir);
  },

  /**
   * Set velocity as a vector.
   *
   * See also Actor#addVelocityVector() and Actor#getVelocityVector().
   *
   * @param {Number} radialDir The direction of the vector to set, in radians.
   * @param {Number} magnitude The magnitude ot the vector to set, in pixels.
   */
  setVelocityVector: function(radialDir, magnitude) {
    this.xVelocity = magnitude * Math.cos(radialDir);
    this.yVelocity = magnitude * Math.sin(radialDir);
  },

  /**
   * Get the velocity vector.
   *
   * See also Actor#addVelocityVector() and Actor#setVelocityVector().
   *
   * @return {Object}
   *   An object with `magnitude` and `direction` attributes indicating the
   *   velocity of the Actor.
   */
  getVelocityVector: function() {
    return {
      magnitude: Math.sqrt(this.xVelocity*this.xVelocity + this.yVelocity*this.yVelocity),
      direction: Math.atan2(this.yVelocity, this.xVelocity),
    };
  },

  /**
   * Add acceleration as a vector.
   *
   * See also Actor#setAccelerationVector() and Actor#getAccelerationVector().
   *
   * @param {Number} radialDir The direction of the vector to add, in radians.
   * @param {Number} magnitude The magnitude ot the vector to add, in pixels.
   */
  addAccelerationVector: function(radialDir, magnitude) {
    this.xAcceleration += magnitude * Math.cos(radialDir);
    this.yAcceleration += magnitude * Math.sin(radialDir);
  },

  /**
   * Set acceleration as a vector.
   *
   * See also Actor#addAccelerationVector() and Actor#getAccelerationVector().
   *
   * @param {Number} radialDir The direction of the vector to set, in radians.
   * @param {Number} magnitude The magnitude ot the vector to set, in pixels.
   */
  setAccelerationVector: function(radialDir, magnitude) {
    this.xAcceleration = magnitude * Math.cos(radialDir);
    this.yAcceleration = magnitude * Math.sin(radialDir);
  },

  /**
   * Get the acceleration vector.
   *
   * See also Actor#addAccelerationVector() and Actor#setAccelerationVector().
   *
   * @return {Object}
   *   An object with `magnitude` and `direction` attributes indicating the
   *   acceleration of the Actor.
   */
  getAccelerationVector: function() {
    return {
      magnitude: Math.sqrt(this.xVelocity*this.xVelocity + this.yVelocity*this.yVelocity),
      direction: Math.atan2(this.yVelocity, this.xVelocity), // yes, this order is correct
    };
  },

  /**
   * Move this Actor outside of another Box so that it no longer overlaps.
   *
   * This is called as part of Actor#collideSolid().
   *
   * See also Actor#moveOutsideX() and Actor#moveOutsideY().
   *
   * @param {Box} other
   *   The other Box that this Actor should be moved outside of.
   *
   * @return {Object}
   *   An object with `x` and `y` properties indicating how far this Actor
   *   moved in order to be outside of the other Box, in pixels.
   */
  moveOutside: function(other) {
    var overlapsX = Math.min(this.x + this.width - other.x, other.x + other.width - this.x),
        overlapsY = Math.min(this.y + this.height - other.y, other.y + other.height - this.y);

    // It matters which axis we move first.
    if (overlapsX <= overlapsY) {
      return {
        x: this.moveOutsideX(other),
        y: this.moveOutsideY(other),
      };
    }
    return {
      y: this.moveOutsideY(other),
      x: this.moveOutsideX(other),
    };
  },

  /**
   * Move this Actor outside of another Box on the x-axis to avoid overlap.
   *
   * See also Actor#moveOutside().
   *
   * @param {Box} other
   *   The other Box that this Actor should be moved outside of.
   *
   * @return {Number}
   *   The distance in pixels that this Actor moved on the x-axis.
   */
  moveOutsideX: function(other) {
    var moved = 0, movedTo;
    // Only adjust if we're intersecting
    if (this.overlaps(other)) {
      // If our center is left of their center, move to the left side
      if (this.x + this.width / 2 < other.x + other.width / 2) {
        movedTo = other.x - this.width - 1;
        moved = movedTo - this.x;
        this.x = movedTo;
      }
      // If our center is right of their center, move to the right side
      else {
        movedTo = other.x + other.width + 1;
        moved = movedTo - this.x;
        this.x = movedTo;
      }
    }
    return moved;
  },

  /**
   * Move this Actor outside of another Box on the y-axis to avoid overlap.
   *
   * See also Actor#moveOutside().
   *
   * @param {Box} other
   *   The other Box that this Actor should be moved outside of.
   *
   * @return {Number}
   *   The distance in pixels that this Actor moved on the y-axis.
   */
  moveOutsideY: function(other) {
    var moved = 0, movedTo;
    // Only adjust if we're intersecting
    if (this.overlaps(other)) {
      // If our center is above their center, move to the top
      if (this.y + this.height / 2 <= other.y + other.height / 2) {
        movedTo = other.y - this.height - 1;
        moved = movedTo - this.y;
        this.y = movedTo;
      }
      // If our center is below their center, move to the bottom
      else {
        movedTo = other.y + other.height + 1;
        moved = movedTo - this.y;
        this.y = movedTo;
      }
    }
    return moved;
  },

  /**
   * Start falling.
   *
   * This method has no meaning if {@link Actor#GRAVITY GRAVITY} is false.
   *
   * Related: Actor#stopFalling(), Actor#isInAir(), Actor#isJumping(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  startFalling: function() {
    // Keep going at the same horizontal speed when walking off a ledge.
    if (!this.inAir && this.fallLeft !== null) {
      this.jumpDirection.left = this.fallLeft;
      this.jumpDirection.right = !this.fallLeft;
    }
    this.inAir = true;
  },

  /**
   * Notify the Actor that it has landed.
   *
   * This method has no meaning if GRAVITY is false.
   *
   * Related: Actor#startFalling(), Actor#isInAir(), Actor#isJumping(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  stopFalling: function() {
    if (this.yAcceleration > 0) {
      this.yAcceleration = 0;
    }
    if (this.yVelocity > 0) {
      this.yVelocity = 0;
    }
    this.numJumps = 0;
    this.inAir = false;
  },

  /**
   * Check whether the Actor is in the air or not.
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isJumping(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  isInAir: function() {
    return this.inAir;
  },

  /**
   * Check whether the Actor is jumping or not.
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isInAir(),
   * Actor#isFalling(), Actor#hasAirMomentum()
   */
  isJumping: function() {
    return this.numJumps > 0;
  },

  /**
   * Check whether the Actor is in the air from falling (as opposed to jumping).
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isInAir(),
   * Actor#isJumping(), Actor#hasAirMomentum()
   */
  isFalling: function() {
    return this.isInAir() && this.numJumps === 0;
  },

  /**
   * Check whether the Actor has air momentum (as opposed to air control).
   *
   * Related: Actor#startFalling(), Actor#stopFalling(), Actor#isInAir(),
   * Actor#isJumping(), Actor#isFalling()
   */
  hasAirMomentum: function() {
    return this.fallLeft !== null ||
      this.jumpDirection.left ||
      this.jumpDirection.right;
  },

  /**
   * Check whether this Actor is standing on top of a Box.
   *
   * @param {Box} box The Box to check.
   */
  standingOn: function(box) {
    if (box instanceof Collection || box instanceof TileMap) {
      var items = box.getAll();
      for (var i = 0, l = items.length; i < l; i++) {
        if (this.standingOn(items[i])) {
          return true;
        }
      }
      return false;
    }
    return this.overlapsX(box) &&
      App.Utils.almostEqual(this.y + this.height, box.y, 1);
  },

  /**
   * Check collision with solids and adjust the Actor's position as necessary.
   *
   * @param {Box/Collection/TileMap} collideWith
   *   A Box, Collection, or TileMap of objects with which to check collision.
   *
   * @return {Boolean}
   *   true if the Actor collided with something; false otherwise.
   */
  collideSolid: function(collideWith) {
    var falling = this.GRAVITY &&
        (this.y + this.height != world.height || !this.STAY_IN_WORLD);
    var result = {}, collided = false;
    if (collideWith instanceof Box) {
      result = this._collideSolidBox(collideWith);
      falling = result.falling;
      collided = result.collided;
    }
    else if (collideWith instanceof Collection || collideWith instanceof TileMap) {
      var items = collideWith.getAll();
      for (var i = 0, l = items.length; i < l; i++) {
        result = this._collideSolidBox(items[i]);
        if (!result.falling) {
          falling = false;
        }
        if (result.collided) {
          collided = true;
        }
      }
    }
    // If the Actor isn't standing on a solid, it needs to start falling.
    if (falling) {
      this.startFalling();
    }
    return collided;
  },

  /**
   * Check collision with a single solid and adjust the Actor's position.
   *
   * See also Actor#collideSolid().
   *
   * @param {Box} collideWith
   *   A Box with which to check collision.
   *
   * @return {Object}
   *   An object with `falling` and `collided` properties (both Booleans
   *   indicating whether the Actor is falling or has collided with a solid).
   *
   * @ignore
   */
  _collideSolidBox: function(collideWith) {
    // "Falling" here really just means "not standing on top of this Box."
    var falling = true, collided = false;
    // If we moved a little too far and now intersect a solid, back out.
    if (this.overlaps(collideWith)) {
      this.moveOutside(collideWith);
      collided = true;
    }
    // If gravity is on, check standing/falling behavior.
    if (this.GRAVITY) {
      // We actually want to check if the last X-position would have been
      // standing, so move back there, check, and then move back to the current
      // position. This is because if a player jumps while moving towards a
      // wall, they could match the standing condition as they just barely
      // reach the top, which will stop their jump arc. If their x-position
      // from the last frame would have been standing, though, we can assume
      // they were already standing rather than jumping.
      var x = this.x;
      this.x = this.lastX;
      if (this.standingOn(collideWith)) {
        this.stopFalling();
        falling = false;
      }
      this.x = x;
      // If we're in the air and we hit something, stop the momentum.
      if (falling && collided) {
        // If we hit the bottom, stop rising.
        if (App.Utils.almostEqual(this.y, collideWith.y + collideWith.height, 1)) {
          if (this.yAcceleration < 0) {
            this.yAcceleration = 0;
          }
          if (this.yVelocity < 0) {
            this.yVelocity = 0;
          }
        }
        // If we hit a side, stop horizontal momentum.
        else {
          this.jumpDirection.left = false;
          this.jumpDirection.right = false;
        }
      }
    }
    return {falling: falling, collided: collided};
  },

  /**
   * Change the Actor's animation sequence if it uses a {@link SpriteMap}.
   *
   * All animations fall back to the "stand" animation if they are not
   * available. The "jumpRight" and "jumpLeft" sequences will try to fall back
   * to the "lookRight" and "lookLeft" sequences first, respectively, if they
   * are not available. Animations that will play by default if they are
   * available include:
   *
   * - stand (required)
   * - left
   * - right
   * - up
   * - down
   * - upRight
   * - upLeft
   * - downRight
   * - downLeft
   * - jump
   * - fall
   * - jumpRight
   * - jumpLeft
   * - lookRight
   * - lookLeft
   * - lookUp
   * - lookDown
   * - lookUpRight
   * - lookUpLeft
   * - lookDownRight
   * - lookDownLeft
   * - drag
   *
   * Override this function if you want to modify the custom rules for which
   * animations to play (or what the animations' names are).
   *
   * This function does nothing if the Actor's `src` attribute is not a
   * SpriteMap.
   *
   * See also Actor#useAnimation().
   */
  updateAnimation: function() {
    if (!(this.src instanceof SpriteMap)) {
      return;
    }
    var lastDirection = this.lastDirection,
        keysIsDefined = typeof keys !== 'undefined'; // Don't fail if "keys" was removed
    // Don't let shooting make us change where we're looking.
    if (keysIsDefined &&
        typeof keys.shoot !== 'undefined' &&
        App.Utils.anyIn(keys.shoot, lastDirection)) {
      lastDirection = this.lastLooked;
    }
    if (this.isBeingDragged) {
      this.useAnimation('drag', 'stand');
    }
    else if (this.isInAir()) {
      if (this.x > this.lastX) {
        this.useAnimation('jumpRight', 'lookRight', 'stand');
      }
      else if (this.x < this.lastX) {
        this.useAnimation('jumpLeft', 'lookLeft', 'stand');
      }
      else if (this.isJumping()) {
        this.useAnimation('jump', 'stand');
      }
      else {
        this.useAnimation('fall', 'stand');
      }
    }
    else if (this.y > this.lastY) {
      if (this.x > this.lastX) {
        this.useAnimation('downRight', 'stand');
      }
      else if (this.x < this.lastX) {
        this.useAnimation('downLeft', 'stand');
      }
      else {
        this.useAnimation('down', 'stand');
      }
    }
    else if (this.y < this.lastY) {
      if (this.x > this.lastX) {
        this.useAnimation('upRight', 'stand');
      }
      else if (this.x < this.lastX) {
        this.useAnimation('upLeft', 'stand');
      }
      else {
        this.useAnimation('up', 'stand');
      }
    }
    else if (this.x > this.lastX) {
      this.useAnimation('right', 'stand');
    }
    else if (this.x < this.lastX) {
      this.useAnimation('left', 'stand');
    }
    else if (keysIsDefined && App.Utils.anyIn(keys.up, lastDirection)) {
      if (App.Utils.anyIn(keys.right, lastDirection)) {
        this.useAnimation('lookUpRight', 'stand');
      }
      else if (App.Utils.anyIn(keys.left, lastDirection)) {
        this.useAnimation('lookUpLeft', 'stand');
      }
      else {
        this.useAnimation('lookUp', 'stand');
      }
    }
    else if (keysIsDefined && App.Utils.anyIn(keys.down, lastDirection)) {
      if (App.Utils.anyIn(keys.right, lastDirection)) {
        this.useAnimation('lookDownRight', 'stand');
      }
      else if (App.Utils.anyIn(keys.left, lastDirection)) {
        this.useAnimation('lookDownLeft', 'stand');
      }
      else {
        this.useAnimation('lookDown', 'stand');
      }
    }
    else if (keysIsDefined && App.Utils.anyIn(keys.right, lastDirection)) {
      this.useAnimation('lookRight', 'stand');
    }
    else if (keysIsDefined && App.Utils.anyIn(keys.left, lastDirection)) {
      this.useAnimation('lookLeft', 'stand');
    }
    else {
      this.useAnimation('stand');
    }
  },

  /**
   * Try to switch to a different {@link SpriteMap} animation sequence.
   *
   * Takes animation sequence names as arguments as switches to the first named
   * sequence that exists in the SpriteMap. If you already know what animation
   * sequences you have available, you might as well just call `this.src.use()`
   * directly.
   *
   * See also Actor#updateAnimation().
   *
   * @param {Arguments} ...
   *   Animation sequence names. Switches to the first one that the SpriteMap
   *   defines.
   *
   * @return {String/Boolean}
   *   The name of the animation sequence to which the Actor switched, if
   *   successful; false otherwise.
   */
  useAnimation: function() {
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if (this.src.maps[a]) {
        this.src.use(a);
        return a;
      }
    }
    return false;
  },

  /**
   * Toggle whether the Actor can be dragged around by the mouse.
   *
   * Note that dragged Actors still follow collision rules. (It is possible to
   * drag an Actor through a wall, but Actors cannot be dropped inside of
   * something solid they collide with.)
   *
   * @param {Boolean} on Whether to enable or disable dragging.
   */
  setDraggable: function(on) {
    if (this.isDraggable && on) {
      return;
    }
    else if (!on) {
      this.isDraggable = false;
      this.unlisten('.drag');
      return;
    }
    this.isDraggable = true;
    this.listen('mousedown.drag touchstart.drag', function() {
      App.isSomethingBeingDragged = true;
      this.isBeingDragged = true;
      this.dragStartX = this.x;
      this.dragStartY = this.y;
      /**
       * @event canvasdragstart
       *   Fires on the document when the user begins dragging an object,
       *   i.e. when the player clicks on or touches an object. Multiple
       *   objects can be dragged at once if they overlap, and this event will
       *   be triggered once for each of them.
       * @param {Actor} obj The object being dragged.
       * @member global
       */
      jQuery(document).trigger('canvasdragstart', [this]);
    });
    this.listen('canvasdragstop.drag', function() {
      this.isBeingDragged = false;
      // If there are no drop targets, the Actor can be dropped anywhere.
      // If there are drop targets and we're not over one, snap back to the
      // starting point.
      var target = this.collides(this.dropTargets);
      if (this.dropTargets.count() && !target) {
        this.x = this.dragStartX;
        this.y = this.dragStartY;
      }
      else if (target) {
        /**
         * @event canvasdrop
         *   Fires on the document when a draggable Actor is dropped onto a
         *   target. This is used **internally** to trigger the event on the
         *   target directly.
         * @param {Box} target The drop target.
         * @member global
         * @ignore
         */
        jQuery(document).trigger('canvasdrop', [target]);
      }
    });
  },

  /**
   * Determine whether this Actor is draggable.
   */
  getDraggable: function() {
    return this.isDraggable;
  },

  /**
   * Notify the Actor that a direction is no longer being given.
   *
   * This is useful when Actors need to distinguish between directions being
   * given continuously (such as when holding down a key) and those being given
   * intermittently (such as a simple key press).
   *
   * @param {String[]} releasedDirections
   *   An Array containing directions that are no longer being given.
   */
  release: function(releasedDirections) {
    if (this.GRAVITY && typeof keys !== 'undefined' &&
        App.Utils.anyIn(keys.up, releasedDirections)) {
      this.jumpKeyDown = false;
    }
  },
});

/**
 * The Player object controlled by the user.
 *
 * If the world is bigger than the canvas, the viewport will shift as a Player
 * moves toward an edge of the viewport. This behavior is usually desirable for
 * situations where a Player is desired, and in other cases (e.g. when the
 * viewport should shift based on the mouse's location) generally a Player
 * should not be used.
 *
 * @extends Actor
 */
var Player = Actor.extend({
  /**
   * The default threshold for how close a Player has to be to an edge before
   * the viewport shifts (in percent of canvas size). To have the viewport move
   * only when the Player is actually at its edge, try a value close to zero.
   * To have the viewport move with the Player, try a value close to 0.5.
   */
  MOVEWORLD: 0.45,

  /**
   * Whether to require that the jump key is released before jumping again.
   *
   * Specifically, this is a boolean which, when true, restricts the Actor from
   * jumping after being in the air until after the Actor is on the ground with
   * the jump key released. This limits the ability to "bounce" by holding down
   * the jump key. This behavior depends on being notified of when keys are
   * released via the release() method, which happens automatically for
   * Players. If you enable this for standard Actors, the meaning of a "key
   * press" is artificial, so you must make sure to call release() before you
   * make the Actor jump again.
   */
  JUMP_RELEASE: true,

  /**
   * @constructor
   *   Initialize a Player.
   *
   * Takes the same parameters as the Box constructor.
   * **Inherited documentation:**
   *
   * @inheritdoc Box#constructor
   */
  init: function() {
    this._super.apply(this, arguments);
    if (arguments.length > 0) {
      world.centerViewportAround(this.x, this.y);
    }
    var t = this;
    this.__keytracker = function() {
      // lastKeyPressed() actually contains all keys that were pressed at the
      // last key event, whereas event.keyPressed just holds the single key
      // that triggered the event.
      t.release([jQuery.hotkeys.lastKeyPressed()]);
    };
    // Notify the Player object when keys are released.
    jQuery(document).on('keyup.release', this.__keytracker);
  },

  /**
   * Override Actor#processInput() to respond to keyboard input automatically.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Actor#processInput
   */
  processInput: function(direction) {
    if (direction === undefined) {
      direction = jQuery.hotkeys.keysDown;
    }
    return this._super(direction);
  },

  /**
   * Override Actor#update() to move the viewport as the Player nears an edge.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Actor#update
   */
  update: function(direction) {
    this._super(direction);
    if (!this.isBeingDragged) {
      this.adjustViewport();
    }
  },

  /**
   * Toggle whether the Player can be dragged around by the mouse.
   *
   * **Inherited documentation:**
   *
   * @inheritdoc Actor#setDraggable
   */
  setDraggable: function(on) {
    if (on && !this.isDraggable) {
      this.listen('canvasdragstop.drag', function() {
        if (this.isBeingDragged &&
            (!this.dropTargets.count() || this.dropTargets.overlaps(this))) {
          world.centerViewportAround(this.x, this.y);
        }
      }, -1);
    }
    this._super.apply(this, arguments);
  },

  /**
   * Move the viewport when the Player gets near the edge.
   *
   * @return {Object}
   *   An object with `x` and `y` properties indicating the number of pixels
   *   this method caused the viewport to shift along each axis.
   */
  adjustViewport: function() {
    var offsets = world.getOffsets(), changed = {x: 0, y: 0};
    // We should only have mouse or player scrolling, but not both.
    if (Mouse.Scroll.isEnabled()) {
      return changed;
    }
    // left
    if (offsets.x > 0 && this.x + this.width/2 - offsets.x < canvas.width * this.MOVEWORLD) {
      world.xOffset = Math.max(offsets.x + (this.x - this.lastX), 0);
      context.translate(offsets.x - world.xOffset, 0);
      changed.x = offsets.x - world.xOffset;
    }
    // right
    else if (offsets.x < world.width - canvas.width &&
        this.x + this.width/2 - offsets.x > canvas.width * (1-this.MOVEWORLD)) {
      world.xOffset = Math.min(offsets.x + (this.x - this.lastX), world.width - canvas.width);
      context.translate(offsets.x - world.xOffset, 0);
      changed.x = offsets.x - world.xOffset;
    }
    // up
    if (offsets.y > 0 && this.y + this.height/2 - offsets.y < canvas.height * this.MOVEWORLD) {
      world.yOffset = Math.max(offsets.y + (this.y - this.lastY), 0);
      context.translate(0, offsets.y - world.yOffset);
      changed.y = offsets.y - world.yOffset;
    }
    // down
    else if (offsets.y < world.height - canvas.height &&
        this.y + this.height/2 - offsets.y > canvas.height * (1-this.MOVEWORLD)) {
      world.yOffset = Math.min(offsets.y + (this.y - this.lastY), world.height - canvas.height);
      context.translate(0, offsets.y - world.yOffset);
      changed.y = offsets.y - world.yOffset;
    }
    return changed;
  },

  /**
   * Clean up after ourselves.
   */
  destroy: function() {
    this._super.apply(this, arguments);
    jQuery(document).off('.release', this.__keytracker);
  },
});
