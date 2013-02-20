//wrap around components
(function () {

    var Components = function () { };
    Components.init = function (Crafty) {
        /**
            * Spatial HashMap for broad phase collision
            *
            * @author Louis Stowasser
            */
        (function (parent) {


            /**@
            * #Crafty.HashMap.constructor
            * @comp Crafty.HashMap
            * @sign public void Crafty.HashMap([cellsize])
            * @param cellsize - the cell size. If omitted, `cellsize` is 64.
            * 
            * Set `cellsize`.
            * And create `this.map`.
            */
            var cellsize,

            HashMap = function (cell) {
                cellsize = cell || 64;
                this.map = {};
            },

            SPACE = " ";

            HashMap.prototype = {
                /**@
                * #Crafty.map.insert
                * @comp Crafty.map
                * @sign public Object Crafty.map.insert(Object obj)
                * @param obj - An entity to be inserted.
                * 
                * `obj` is inserted in '.map' of the corresponding broad phase cells. An object of the following fields is returned.
                * ~~~
                * - the object that keep track of cells (keys)
                * - `obj`
                * - the HashMap object
                * ~~~
                */
                insert: function (obj) {
                    var keys = HashMap.key(obj),
                    entry = new Entry(keys, obj, this),
                    i = 0,
                    j,
                    hash;

                    //insert into all x buckets
                    for (i = keys.x1; i <= keys.x2; i++) {
                        //insert into all y buckets
                        for (j = keys.y1; j <= keys.y2; j++) {
                            hash = i + SPACE + j;
                            if (!this.map[hash]) this.map[hash] = [];
                            this.map[hash].push(obj);
                        }
                    }

                    return entry;
                },

                /**@
                * #Crafty.map.search
                * @comp Crafty.map
                * @sign public Object Crafty.map.search(Object rect[, Boolean filter])
                * @param rect - the rectangular region to search for entities.
                * @param filter - Default value is true. Otherwise, must be false.
                * 
                * - If `filter` is `false`, just search for all the entries in the give `rect` region by broad phase collision. Entity may be returned duplicated.
                * - If `filter` is `true`, filter the above results by checking that they actually overlap `rect`.
                * The easier usage is with `filter`=`true`. For performance reason, you may use `filter`=`false`, and filter the result yourself. See examples in drawing.js and collision.js
                */
                search: function (rect, filter) {
                    var keys = HashMap.key(rect),
                    i, j, l,
                    hash,
                    results = [];

                    if (filter === undefined) filter = true; //default filter to true

                    //search in all x buckets
                    for (i = keys.x1; i <= keys.x2; i++) {
                        //insert into all y buckets
                        for (j = keys.y1; j <= keys.y2; j++) {
                            hash = i + SPACE + j;

                            if (this.map[hash]) {
                                results = results.concat(this.map[hash]);
                            }
                        }
                    }

                    if (filter) {
                        var obj, id, finalresult = [], found = {};
                        //add unique elements to lookup table with the entity ID as unique key
                        for (i = 0, l = results.length; i < l; i++) {
                            obj = results[i];
                            if (!obj) continue; //skip if deleted
                            id = obj[0]; //unique ID

                            //check if not added to hash and that actually intersects
                            if (!found[id] && obj.x < rect._x + rect._w && obj._x + obj._w > rect._x &&
                                    obj.y < rect._y + rect._h && obj._h + obj._y > rect._y)
                                found[id] = results[i];
                        }

                        //loop over lookup table and copy to final array
                        for (obj in found) finalresult.push(found[obj]);

                        return finalresult;
                    } else {
                        return results;
                    }
                },

                /**@
                * #Crafty.map.remove
                * @comp Crafty.map
                * @sign public void Crafty.map.remove([Object keys, ]Object obj)
                * @param keys - key region. If omitted, it will be derived from obj by `Crafty.HashMap.key`.
                * @param obj - need more document.
                * 
                * Remove an entity in a broad phase map.
                * - The second form is only used in Crafty.HashMap to save time for computing keys again, where keys were computed previously from obj. End users should not call this form directly.
                *
                * @example 
                * ~~~
                * Crafty.map.remove(e);
                * ~~~
                */
                remove: function (keys, obj) {
                    var i = 0, j, hash;

                    if (arguments.length == 1) {
                        obj = keys;
                        keys = HashMap.key(obj);
                    }

                    //search in all x buckets
                    for (i = keys.x1; i <= keys.x2; i++) {
                        //insert into all y buckets
                        for (j = keys.y1; j <= keys.y2; j++) {
                            hash = i + SPACE + j;

                            if (this.map[hash]) {
                                var cell = this.map[hash],
                                m,
                                n = cell.length;
                                //loop over objs in cell and delete
                                for (m = 0; m < n; m++)
                                    if (cell[m] && cell[m][0] === obj[0])
                                        cell.splice(m, 1);
                            }
                        }
                    }
                },

                /**@
                * #Crafty.map.boundaries
                * @comp Crafty.map
                * @sign public Object Crafty.map.boundaries()
                * 
                * The return `Object` is of the following format.
                * ~~~
                * {
                *   min: {
                *     x: val_x,
                *     y: val_y
                *   },
                *   max: {
                *     x: val_x,
                *     y: val_y
                *   }
                * }
                * ~~~
                */
                boundaries: function () {
                    var k, ent,
                    hash = {
                        max: { x: -Infinity, y: -Infinity },
                        min: { x: Infinity, y: Infinity }
                    },
                    coords = {
                        max: { x: -Infinity, y: -Infinity },
                        min: { x: Infinity, y: Infinity }
                    };

                    //Using broad phase hash to speed up the computation of boundaries.
                    for (var h in this.map) {
                        if (!this.map[h].length) continue;

                        //broad phase coordinate
                        var map_coord = h.split(SPACE),
                            i = map_coord[0],
                            j = map_coord[0];
                        if (i >= hash.max.x) {
                            hash.max.x = i;
                            for (k in this.map[h]) {
                                ent = this.map[h][k];
                                //make sure that this is a Crafty entity
                                if (typeof ent == 'object' && 'requires' in ent) {
                                    coords.max.x = Math.max(coords.max.x, ent.x + ent.w);
                                }
                            }
                        }
                        if (i <= hash.min.x) {
                            hash.min.x = i;
                            for (k in this.map[h]) {
                                ent = this.map[h][k];
                                if (typeof ent == 'object' && 'requires' in ent) {
                                    coords.min.x = Math.min(coords.min.x, ent.x);
                                }
                            }
                        }
                        if (j >= hash.max.y) {
                            hash.max.y = j;
                            for (k in this.map[h]) {
                                ent = this.map[h][k];
                                if (typeof ent == 'object' && 'requires' in ent) {
                                    coords.max.y = Math.max(coords.max.y, ent.y + ent.h);
                                }
                            }
                        }
                        if (j <= hash.min.y) {
                            hash.min.y = j;
                            for (k in this.map[h]) {
                                ent = this.map[h][k];
                                if (typeof ent == 'object' && 'requires' in ent) {
                                    coords.min.y = Math.min(coords.min.y, ent.y);
                                }
                            }
                        }
                    }

                    return coords;
                }
            };

            /**@
            * #Crafty.HashMap
            * @category 2D
            * Broad-phase collision detection engine. See background information at 
            *
            * ~~~
            * - [N Tutorial B - Broad-Phase Collision](http://www.metanetsoftware.com/technique/tutorialB.html)
            * - [Broad-Phase Collision Detection with CUDA](http.developer.nvidia.com/GPUGems3/gpugems3_ch32.html)
            * ~~~
            * @see Crafty.map
            */

            /**@
            * #Crafty.HashMap.key
            * @comp Crafty.HashMap
            * @sign public Object Crafty.HashMap.key(Object obj)
            * @param obj - an Object that has .mbr() or _x, _y, _w and _h.
            * Get the rectangular region (in terms of the grid, with grid size `cellsize`), where the object may fall in. This region is determined by the object's bounding box.
            * The `cellsize` is 64 by default.
            * 
            * @see Crafty.HashMap.constructor
            */
            HashMap.key = function (obj) {
                if (obj.hasOwnProperty('mbr')) {
                    obj = obj.mbr();
                }
                var x1 = Math.floor(obj._x / cellsize),
                y1 = Math.floor(obj._y / cellsize),
                x2 = Math.floor((obj._w + obj._x) / cellsize),
                y2 = Math.floor((obj._h + obj._y) / cellsize);
                return { x1: x1, y1: y1, x2: x2, y2: y2 };
            };

            HashMap.hash = function (keys) {
                return keys.x1 + SPACE + keys.y1 + SPACE + keys.x2 + SPACE + keys.y2;
            };

            function Entry(keys, obj, map) {
                this.keys = keys;
                this.map = map;
                this.obj = obj;
            }

            Entry.prototype = {
                update: function (rect) {
                    //check if buckets change
                    if (HashMap.hash(HashMap.key(rect)) != HashMap.hash(this.keys)) {
                        this.map.remove(this.keys, this.obj);
                        var e = this.map.insert(this.obj);
                        this.keys = e.keys;
                    }
                }
            };

            parent.HashMap = HashMap;
        })(Crafty);
        (function (parent) {
            /**@
            * #Crafty.map
            * @category 2D
            * Functions related with querying entities.
            * @see Crafty.HashMap
            */
            parent.map = new parent.HashMap();
            var M = Math,
                Mc = M.cos,
                Ms = M.sin,
                PI = M.PI,
                DEG_TO_RAD = PI / 180;


            /**@
            * #2D
            * @category 2D
            * Component for any entity that has a position on the stage.
            * @trigger Move - when the entity has moved - { _x:Number, _y:Number, _w:Number, _h:Number } - Old position
            * @trigger Change - when the entity has moved - { _x:Number, _y:Number, _w:Number, _h:Number } - Old position
            * @trigger Rotate - when the entity is rotated - { cos:Number, sin:Number, deg:Number, rad:Number, o: {x:Number, y:Number}, matrix: {M11, M12, M21, M22} }
            */
            parent.c("2D", {
                /**@
                    * #.x
                    * @comp 2D
                    * The `x` position on the stage. When modified, will automatically be redrawn.
                    * Is actually a getter/setter so when using this value for calculations and not modifying it,
                    * use the `._x` property.
                    * @see ._attr
                    */
                _x: 0,
                /**@
                * #.y
                * @comp 2D
                * The `y` position on the stage. When modified, will automatically be redrawn.
                * Is actually a getter/setter so when using this value for calculations and not modifying it,
                * use the `._y` property.
                * @see ._attr
                */
                _y: 0,
                /**@
                * #.w
                * @comp 2D
                * The width of the entity. When modified, will automatically be redrawn.
                * Is actually a getter/setter so when using this value for calculations and not modifying it,
                * use the `._w` property.
                *
                * Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
                * @see ._attr
                */
                _w: 0,
                /**@
                * #.h
                * @comp 2D
                * The height of the entity. When modified, will automatically be redrawn.
                * Is actually a getter/setter so when using this value for calculations and not modifying it,
                * use the `._h` property.
                *
                * Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
                * @see ._attr
                */
                _h: 0,
                /**@
                * #.z
                * @comp 2D
                * The `z` index on the stage. When modified, will automatically be redrawn.
                * Is actually a getter/setter so when using this value for calculations and not modifying it,
                * use the `._z` property.
                *
                * A higher `z` value will be closer to the front of the stage. A smaller `z` value will be closer to the back.
                * A global Z index is produced based on its `z` value as well as the GID (which entity was created first).
                * Therefore entities will naturally maintain order depending on when it was created if same z value.
                * @see ._attr
                */
                _z: 0,
                /**@
                * #.rotation
                * @comp 2D
                * Set the rotation of your entity. Rotation takes degrees in a clockwise direction.
                * It is important to note there is no limit on the rotation value. Setting a rotation
                * mod 360 will give the same rotation without reaching huge numbers.
                * @see ._attr
                */
                _rotation: 0,
                /**@
                * #.alpha
                * @comp 2D
                * Transparency of an entity. Must be a decimal value between 0.0 being fully transparent to 1.0 being fully opaque.
                */
                _alpha: 1.0,
                /**@
                * #.visible
                * @comp 2D
                * If the entity is visible or not. Accepts a true or false value.
                * Can be used for optimization by setting an entities visibility to false when not needed to be drawn.
                *
                * The entity will still exist and can be collided with but just won't be drawn.
                * @see Crafty.DrawManager.draw, Crafty.DrawManager.drawAll
                */
                _visible: true,

                /**@
                * #._globalZ
                * @comp 2D
                * When two entities overlap, the one with the larger `_globalZ` will be on top of the other.
                * @see Crafty.DrawManager.draw, Crafty.DrawManager.drawAll
                */
                _globalZ: null,

                _origin: null,
                _mbr: null,
                _entry: null,
                _children: null,
                _parent: null,
                _changed: false,

                _defineGetterSetter_setter: function () {
                    //create getters and setters using __defineSetter__ and __defineGetter__
                    this.__defineSetter__('x', function (v) { this._attr('_x', v); });
                    this.__defineSetter__('y', function (v) { this._attr('_y', v); });
                    this.__defineSetter__('w', function (v) { this._attr('_w', v); });
                    this.__defineSetter__('h', function (v) { this._attr('_h', v); });
                    this.__defineSetter__('z', function (v) { this._attr('_z', v); });
                    this.__defineSetter__('rotation', function (v) { this._attr('_rotation', v); });
                    this.__defineSetter__('alpha', function (v) { this._attr('_alpha', v); });
                    this.__defineSetter__('visible', function (v) { this._attr('_visible', v); });

                    this.__defineGetter__('x', function () { return this._x; });
                    this.__defineGetter__('y', function () { return this._y; });
                    this.__defineGetter__('w', function () { return this._w; });
                    this.__defineGetter__('h', function () { return this._h; });
                    this.__defineGetter__('z', function () { return this._z; });
                    this.__defineGetter__('rotation', function () { return this._rotation; });
                    this.__defineGetter__('alpha', function () { return this._alpha; });
                    this.__defineGetter__('visible', function () { return this._visible; });
                    this.__defineGetter__('parent', function () { return this._parent; });
                    this.__defineGetter__('numChildren', function () { return this._children.length; });
                },

                _defineGetterSetter_defineProperty: function () {
                    Object.defineProperty(this, 'x', {
                        set: function (v) {
                            this._attr('_x', v);
                        },
                        get: function () {
                            return this._x;
                        },
                        configurable: true
                    });
                    Object.defineProperty(this, 'y', {
                        set: function (v) {
                            this._attr('_y', v);
                        },
                        get: function () {
                            return this._y;
                        },
                        configurable: true
                    });
                    Object.defineProperty(this, 'w', {
                        set: function (v) {
                            this._attr('_w', v);
                        },
                        get: function () {
                            return this._w;
                        },
                        configurable: true
                    });
                    Object.defineProperty(this, 'h', {
                        set: function (v) {
                            this._attr('_h', v);
                        },
                        get: function () {
                            return this._h;
                        },
                        configurable: true
                    });
                    Object.defineProperty(this, 'z', {
                        set: function (v) {
                            this._attr('_z', v);
                        },
                        get: function () {
                            return this._z;
                        },
                        configurable: true
                    });
                    Object.defineProperty(this, 'rotation', {
                        set: function (v) {
                            this._attr('_rotation', v);
                        },
                        get: function () {
                            return this._rotation;
                        },
                        configurable: true
                    });
                    Object.defineProperty(this, 'alpha', {
                        set: function (v) {
                            this._attr('_alpha', v);
                        },
                        get: function () {
                            return this._alpha;
                        },
                        configurable: true
                    });
                    Object.defineProperty(this, 'visible', {
                        set: function (v) {
                            this._attr('_visible', v);
                        },
                        get: function () {
                            return this._visible;
                        },
                        configurable: true
                    });
                },

                _defineGetterSetter_fallback: function () {
                    //set the public properties to the current private properties
                    this.x = this._x;
                    this.y = this._y;
                    this.w = this._w;
                    this.h = this._h;
                    this.z = this._z;
                    this.rotation = this._rotation;
                    this.alpha = this._alpha;
                    this.visible = this._visible;

                    //on every frame check for a difference in any property
                    this.bind("EnterFrame", function () {
                        //if there are differences between the public and private properties
                        if (this.x !== this._x || this.y !== this._y || this.w !== this._w || this.h !== this._h || this.z !== this._z || this.rotation !== this._rotation || this.alpha !== this._alpha || this.visible !== this._visible) {
                            //save the old positions
                            var old = this.mbr() || this.pos();

                            //if rotation has changed, use the private rotate method
                            if (this.rotation !== this._rotation) {
                                this._rotate(this.rotation);
                            }
                            else {
                                //update the MBR
                                var mbr = this._mbr,
                                    moved = false;
                                // If the browser doesn't have getters or setters,
                                // {x, y, w, h, z} and {_x, _y, _w, _h, _z} may be out of sync,
                                // in which case t checks if they are different on tick and executes the Change event.
                                if (mbr) { //check each value to see which has changed
                                    if (this.x !== this._x) {
                                        mbr._x -= this.x - this._x;
                                        moved = true;
                                    }
                                    else if (this.y !== this._y) {
                                        mbr._y -= this.y - this._y;
                                        moved = true;
                                    }
                                    else if (this.w !== this._w) {
                                        mbr._w -= this.w - this._w;
                                        moved = true;
                                    }
                                    else if (this.h !== this._h) {
                                        mbr._h -= this.h - this._h;
                                        moved = true;
                                    }
                                    else if (this.z !== this._z) {
                                        mbr._z -= this.z - this._z;
                                        moved = true;
                                    }
                                }

                                //if the moved flag is true, trigger a move
                                if (moved) this.trigger("Move", old);
                            }

                            //set the public properties to the private properties
                            this._x = this.x;
                            this._y = this.y;
                            this._w = this.w;
                            this._h = this.h;
                            this._z = this.z;
                            this._rotation = this.rotation;
                            this._alpha = this.alpha;
                            this._visible = this.visible;

                            //trigger the changes
                            this.trigger("Change", old);
                            //without this entities weren't added correctly to Crafty.map.map in IE8.
                            //not entirely sure this is the best way to fix it though
                            this.trigger("Move", old);
                        }
                    });
                },

                init: function () {
                    this._globalZ = this[0];
                    this._origin = { x: 0, y: 0 };
                    this._children = [];

                    if (parent.support.setter) {
                        this._defineGetterSetter_setter();
                    } else if (parent.support.defineProperty) {
                        //IE9 supports Object.defineProperty
                        this._defineGetterSetter_defineProperty();
                    } else {
                        /*
                        If no setters and getters are supported (e.g. IE8) supports,
                        check on every frame for a difference between this._(x|y|w|h|z...)
                        and this.(x|y|w|h|z) and update accordingly.
                        */
                        this._defineGetterSetter_fallback();
                    }

                    //insert self into the HashMap
                    this._entry = parent.map.insert(this);

                    //when object changes, update HashMap
                    this.bind("Move", function (e) {
                        var area = this._mbr || this;
                        this._entry.update(area);
                        this._cascade(e);
                    });

                    this.bind("Rotate", function (e) {
                        var old = this._mbr || this;
                        this._entry.update(old);
                        this._cascade(e);
                    });

                    //when object is removed, remove from HashMap and destroy attached children
                    this.bind("Remove", function () {
                        if (this._children) {
                            for (var i = 0; i < this._children.length; i++) {
                                if (this._children[i].destroy) {
                                    this._children[i].destroy();
                                }
                            }
                            this._children = [];
                        }

                        if (this._parent) {
                            this._parent.detach(this);
                        }

                        parent.map.remove(this);

                        this.detach();
                    });
                },

                /**
                * Calculates the MBR when rotated with an origin point
                */
                _rotate: function (v) {
                    var theta = -1 * (v % 360), //angle always between 0 and 359
                      rad = theta * DEG_TO_RAD,
                      ct = Math.cos(rad), //cache the sin and cosine of theta
                      st = Math.sin(rad),
                      o = {
                          x: this._origin.x + this._x,
                          y: this._origin.y + this._y
                      };

                    //if the angle is 0 and is currently 0, skip
                    if (!theta) {
                        this._mbr = null;
                        if (!this._rotation % 360) return;
                    }

                    var x0 = o.x + (this._x - o.x) * ct + (this._y - o.y) * st,
                      y0 = o.y - (this._x - o.x) * st + (this._y - o.y) * ct,
                      x1 = o.x + (this._x + this._w - o.x) * ct + (this._y - o.y) * st,
                      y1 = o.y - (this._x + this._w - o.x) * st + (this._y - o.y) * ct,
                      x2 = o.x + (this._x + this._w - o.x) * ct + (this._y + this._h - o.y) * st,
                      y2 = o.y - (this._x + this._w - o.x) * st + (this._y + this._h - o.y) * ct,
                      x3 = o.x + (this._x - o.x) * ct + (this._y + this._h - o.y) * st,
                      y3 = o.y - (this._x - o.x) * st + (this._y + this._h - o.y) * ct,
                      minx = Math.round(Math.min(x0, x1, x2, x3)),
                      miny = Math.round(Math.min(y0, y1, y2, y3)),
                      maxx = Math.round(Math.max(x0, x1, x2, x3)),
                      maxy = Math.round(Math.max(y0, y1, y2, y3));

                    this._mbr = { _x: minx, _y: miny, _w: maxx - minx, _h: maxy - miny };

                    //trigger rotation event
                    var difference = this._rotation - v,
                      drad = difference * DEG_TO_RAD;

                    this.trigger("Rotate", {
                        cos: Math.cos(drad),
                        sin: Math.sin(drad),
                        deg: difference,
                        rad: drad,
                        o: { x: o.x, y: o.y },
                        matrix: { M11: ct, M12: st, M21: -st, M22: ct }
                    });
                },

                /**@
                * #.area
                * @comp 2D
                * @sign public Number .area(void)
                * Calculates the area of the entity
                */
                area: function () {
                    return this._w * this._h;
                },

                /**@
                * #.intersect
                * @comp 2D
                * @sign public Boolean .intersect(Number x, Number y, Number w, Number h)
                * @param x - X position of the rect
                * @param y - Y position of the rect
                * @param w - Width of the rect
                * @param h - Height of the rect
                * @sign public Boolean .intersect(Object rect)
                * @param rect - An object that must have the `x, y, w, h` values as properties
                * Determines if this entity intersects a rectangle.
                */
                intersect: function (x, y, w, h) {
                    var rect, obj = this._mbr || this;
                    if (typeof x === "object") {
                        rect = x;
                    } else {
                        rect = { x: x, y: y, w: w, h: h };
                    }

                    return obj._x < rect.x + rect.w && obj._x + obj._w > rect.x &&
                                obj._y < rect.y + rect.h && obj._h + obj._y > rect.y;
                },

                /**@
                * #.within
                * @comp 2D
                * @sign public Boolean .within(Number x, Number y, Number w, Number h)
                * @param x - X position of the rect
                * @param y - Y position of the rect
                * @param w - Width of the rect
                * @param h - Height of the rect
                * @sign public Boolean .within(Object rect)
                * @param rect - An object that must have the `x, y, w, h` values as properties
                * Determines if this current entity is within another rectangle.
                */
                within: function (x, y, w, h) {
                    var rect;
                    if (typeof x === "object") {
                        rect = x;
                    } else {
                        rect = { x: x, y: y, w: w, h: h };
                    }

                    return rect.x <= this.x && rect.x + rect.w >= this.x + this.w &&
                        rect.y <= this.y && rect.y + rect.h >= this.y + this.h;
                },

                /**@
                * #.contains
                * @comp 2D
                * @sign public Boolean .contains(Number x, Number y, Number w, Number h)
                * @param x - X position of the rect
                * @param y - Y position of the rect
                * @param w - Width of the rect
                * @param h - Height of the rect
                * @sign public Boolean .contains(Object rect)
                * @param rect - An object that must have the `x, y, w, h` values as properties
                * Determines if the rectangle is within the current entity.
                */
                contains: function (x, y, w, h) {
                    var rect;
                    if (typeof x === "object") {
                        rect = x;
                    } else {
                        rect = { x: x, y: y, w: w, h: h };
                    }

                    return rect.x >= this.x && rect.x + rect.w <= this.x + this.w &&
                        rect.y >= this.y && rect.y + rect.h <= this.y + this.h;
                },

                /**@
                * #.pos
                * @comp 2D
                * @sign public Object .pos(void)
                * Returns the x, y, w, h properties as a rect object
                * (a rect object is just an object with the keys _x, _y, _w, _h).
                *
                * The keys have an underscore prefix. This is due to the x, y, w, h
                * properties being merely setters and getters that wrap the properties with an underscore (_x, _y, _w, _h).
                */
                pos: function () {
                    return {
                        _x: (this._x),
                        _y: (this._y),
                        _w: (this._w),
                        _h: (this._h)
                    };
                },

                /**@
                * #.mbr
                * @comp 2D
                * @sign public Object .mbr()
                * Returns the minimum bounding rectangle. If there is no rotation
                * on the entity it will return the rect.
                */
                mbr: function () {
                    if (!this._mbr) return this.pos();
                    return {
                        _x: (this._mbr._x),
                        _y: (this._mbr._y),
                        _w: (this._mbr._w),
                        _h: (this._mbr._h)
                    };
                },

                /**@
                * #.isAt
                * @comp 2D
                * @sign public Boolean .isAt(Number x, Number y)
                * @param x - X position of the point
                * @param y - Y position of the point
                * Determines whether a point is contained by the entity. Unlike other methods,
                * an object can't be passed. The arguments require the x and y value
                */
                isAt: function (x, y) {
                    if (this.mapArea) {
                        return this.mapArea.containsPoint(x, y);
                    } else if (this.map) {
                        return this.map.containsPoint(x, y);
                    }
                    return this.x <= x && this.x + this.w >= x &&
                                this.y <= y && this.y + this.h >= y;
                },

                /**@
                * #.move
                * @comp 2D
                * @sign public this .move(String dir, Number by)
                * @param dir - Direction to move (n,s,e,w,ne,nw,se,sw)
                * @param by - Amount to move in the specified direction
                * Quick method to move the entity in a direction (n, s, e, w, ne, nw, se, sw) by an amount of pixels.
                */
                move: function (dir, by) {
                    if (dir.charAt(0) === 'n') this.y -= by;
                    if (dir.charAt(0) === 's') this.y += by;
                    if (dir === 'e' || dir.charAt(1) === 'e') this.x += by;
                    if (dir === 'w' || dir.charAt(1) === 'w') this.x -= by;

                    return this;
                },

                /**@
                * #.shift
                * @comp 2D
                * @sign public this .shift(Number x, Number y, Number w, Number h)
                * @param x - Amount to move X
                * @param y - Amount to move Y
                * @param w - Amount to widen
                * @param h - Amount to increase height
                * Shift or move the entity by an amount. Use negative values
                * for an opposite direction.
                */
                shift: function (x, y, w, h) {
                    if (x) this.x += x;
                    if (y) this.y += y;
                    if (w) this.w += w;
                    if (h) this.h += h;

                    return this;
                },

                /**@
                * #._cascade
                * @comp 2D
                  * @sign public void ._cascade(e)
                * @param e - Amount to move X
                * Shift move or rotate the entity by an amount. Use negative values
                * for an opposite direction.
                */
                _cascade: function (e) {
                    if (!e) return; //no change in position
                    var i = 0, children = this._children, l = children.length, obj;
                    //rotation
                    if (e.cos) {
                        for (; i < l; ++i) {
                            obj = children[i];
                            if ('rotate' in obj) obj.rotate(e);
                        }
                    } else {
                        //use MBR or current
                        var rect = this._mbr || this,
                          dx = rect._x - e._x,
                          dy = rect._y - e._y,
                          dw = rect._w - e._w,
                          dh = rect._h - e._h;

                        for (; i < l; ++i) {
                            obj = children[i];
                            obj.shift(dx, dy, dw, dh);
                        }
                    }
                },

                /**@
                * #.attach
                * @comp 2D
                * @sign public this .attach(Entity obj[, .., Entity objN])
                * @param obj - Entity(s) to attach
                * Attaches an entities position and rotation to current entity. When the current entity moves,
                * the attached entity will move by the same amount. Attached entities stored in _children array,
                * the parent object is stored in _parent on the child entities.
                *
                * As many objects as wanted can be attached and a hierarchy of objects is possible by attaching.
                */
                attach: function () {
                    var i = 0, arg = arguments, l = arguments.length, obj;
                    for (; i < l; ++i) {
                        obj = arg[i];
                        if (obj._parent) { obj._parent.detach(obj); }
                        obj._parent = this;
                        this._children.push(obj);
                    }

                    return this;
                },

                /**@
                * #.detach
                * @comp 2D
                * @sign public this .detach([Entity obj])
                * @param obj - The entity to detach. Left blank will remove all attached entities
                * Stop an entity from following the current entity. Passing no arguments will stop
                * every entity attached.
                */
                detach: function (obj) {
                    var i = 0;
                    //if nothing passed, remove all attached objects
                    if (!obj) {
                        for (i = 0; i < this._children.length; i++) {
                            this._children[i]._parent = null;
                        }
                        this._children = [];
                        return this;
                    }

                    //if obj passed, find the handler and unbind
                    for (i = 0; i < this._children.length; i++) {
                        if (this._children[i] == obj) {
                            this._children.splice(i, 1);
                        }
                    }
                    obj._parent = null;

                    return this;
                },

                /**@
                * #.origin
                * @comp 2D
                * @sign public this .origin(Number x, Number y)
                * @param x - Pixel value of origin offset on the X axis
                * @param y - Pixel value of origin offset on the Y axis
                * @sign public this .origin(String offset)
                * @param offset - Combination of center, top, bottom, middle, left and right
                * Set the origin point of an entity for it to rotate around.
                *
                * @example
                * ~~~
                * this.origin("top left")
                * this.origin("center")
                * this.origin("bottom right")
                * this.origin("middle right")
                * ~~~
                *
                * @see .rotation
                */
                origin: function (x, y) {
                    //text based origin
                    if (typeof x === "string") {
                        if (x === "centre" || x === "center" || x.indexOf(' ') === -1) {
                            x = this._w / 2;
                            y = this._h / 2;
                        } else {
                            var cmd = x.split(' ');
                            if (cmd[0] === "top") y = 0;
                            else if (cmd[0] === "bottom") y = this._h;
                            else if (cmd[0] === "middle" || cmd[1] === "center" || cmd[1] === "centre") y = this._h / 2;

                            if (cmd[1] === "center" || cmd[1] === "centre" || cmd[1] === "middle") x = this._w / 2;
                            else if (cmd[1] === "left") x = 0;
                            else if (cmd[1] === "right") x = this._w;
                        }
                    }

                    this._origin.x = x;
                    this._origin.y = y;

                    return this;
                },

                /**@
                * #.flip
                * @comp 2D
                * @trigger Change - when the entity has flipped
                * @sign public this .flip(String dir)
                * @param dir - Flip direction
                *
                * Flip entity on passed direction
                *
                * @example
                * ~~~
                * this.flip("X")
                * ~~~
                */
                flip: function (dir) {
                    dir = dir || "X";
                    if (!this["_flip" + dir]) {
                        this["_flip" + dir] = true;
                        this.trigger("Change");
                    }
                },

                /**@
                * #.unflip
                * @comp 2D
                * @trigger Change - when the entity has unflipped
                * @sign public this .unflip(String dir)
                * @param dir - Unflip direction
                *
                * Unflip entity on passed direction (if it's flipped)
                *
                * @example
                * ~~~
                * this.unflip("X")
                * ~~~
                */
                unflip: function (dir) {
                    dir = dir || "X";
                    if (this["_flip" + dir]) {
                        this["_flip" + dir] = false;
                        this.trigger("Change");
                    }
                },

                /**
                * Method for rotation rather than through a setter
                */
                rotate: function (e) {
                    //assume event data origin
                    this._origin.x = e.o.x - this._x;
                    this._origin.y = e.o.y - this._y;

                    //modify through the setter method
                    this._attr('_rotation', e.theta);
                },

                /**@
                * #._attr
                * @comp 2D
                * Setter method for all 2D properties including
                * x, y, w, h, alpha, rotation and visible.
                */
                _attr: function (name, value) {
                    //keep a reference of the old positions
                    var pos = this.pos(),
                      old = this.mbr() || pos;

                    //if rotation, use the rotate method
                    if (name === '_rotation') {
                        this._rotate(value);
                        this.trigger("Rotate");
                        //set the global Z and trigger reorder just in case
                    } else if (name === '_z') {
                        this._globalZ = parseInt(value + parent.zeroFill(this[0], 5), 10); //magic number 10e5 is the max num of entities
                        this.trigger("reorder");
                        //if the rect bounds change, update the MBR and trigger move
                    } else if (name == '_x' || name === '_y' || name === '_w' || name === '_h') {
                        var mbr = this._mbr;
                        if (mbr) {
                            mbr[name] -= this[name] - value;
                        }
                        this[name] = value;
                        this.trigger("Move", old);
                    }

                    //everything will assume the value
                    this[name] = value;

                    //trigger a change
                    this.trigger("Change", old);
                }
            });

            parent.c("Physics", {
                _gravity: 0.4,
                _friction: 0.2,
                _bounce: 0.5,

                gravity: function (gravity) {
                    this._gravity = gravity;
                }
            });

            /**@
            * #Gravity
            * @category 2D
            * Adds gravitational pull to the entity.
            */
            parent.c("Gravity", {
                _gravityConst: 0.2,
                _gy: 0,
                _falling: true,
                _anti: null,

                init: function () {
                    this.requires("2D");
                },

                /**@
                * #.gravity
                * @comp Gravity
                * @sign public this .gravity([comp])
                * @param comp - The name of a component that will stop this entity from falling
                *
                * Enable gravity for this entity no matter whether comp parameter is not specified,
                * If comp parameter is specified all entities with that component will stop this entity from falling.
                * For a player entity in a platform game this would be a component that is added to all entities
                * that the player should be able to walk on.
                *
                * @example
                * ~~~
                * Crafty.e("2D, DOM, Color, Gravity")
                *   .color("red")
                *   .attr({ w: 100, h: 100 })
                *   .gravity("platform")
                * ~~~
                */
                gravity: function (comp) {
                    if (comp) this._anti = comp;

                    this.bind("EnterFrame", this._enterFrame);

                    return this;
                },

                /**@
                * #.gravityConst
                * @comp Gravity
                * @sign public this .gravityConst(g)
                * @param g - gravitational constant
                *
                * Set the gravitational constant to g. The default is .2. The greater g, the faster the object falls.
                *
                * @example
                * ~~~
                * Crafty.e("2D, DOM, Color, Gravity")
                *   .color("red")
                *   .attr({ w: 100, h: 100 })
                *   .gravity("platform")
                *   .gravityConst(2)
                * ~~~
                */
                gravityConst: function (g) {
                    this._gravityConst = g;
                    return this;
                },

                _enterFrame: function () {
                    if (this._falling) {
                        //if falling, move the players Y
                        this._gy += this._gravityConst;
                        this.y += this._gy;
                    } else {
                        this._gy = 0; //reset change in y
                    }

                    var obj, hit = false, pos = this.pos(),
                      q, i = 0, l;

                    //Increase by 1 to make sure map.search() finds the floor
                    pos._y++;

                    //map.search wants _x and intersect wants x...
                    pos.x = pos._x;
                    pos.y = pos._y;
                    pos.w = pos._w;
                    pos.h = pos._h;

                    q = parent.map.search(pos);
                    l = q.length;

                    for (; i < l; ++i) {
                        obj = q[i];
                        //check for an intersection directly below the player
                        if (obj !== this && obj.has(this._anti) && obj.intersect(pos)) {
                            hit = obj;
                            break;
                        }
                    }

                    if (hit) { //stop falling if found
                        if (this._falling) this.stopFalling(hit);
                    } else {
                        this._falling = true; //keep falling otherwise
                    }
                },

                stopFalling: function (e) {
                    if (e) this.y = e._y - this._h; //move object

                    //this._gy = -1 * this._bounce;
                    this._falling = false;
                    if (this._up) this._up = false;
                    this.trigger("hit");
                },

                /**@
                * #.antigravity
                * @comp Gravity
                * @sign public this .antigravity()
                * Disable gravity for this component. It can be reenabled by calling .gravity()
                */
                antigravity: function () {
                    this.unbind("EnterFrame", this._enterFrame);
                }
            });

            /**@
            * #Crafty.polygon
            * @category 2D
            *
            * Polygon object used for hitboxes and click maps. Must pass an Array for each point as an
            * argument where index 0 is the x position and index 1 is the y position.
            *
            * For example one point of a polygon will look like this: `[0,5]` where the `x` is `0` and the `y` is `5`.
            *
            * Can pass an array of the points or simply put each point as an argument.
            *
            * When creating a polygon for an entity, each point should be offset or relative from the entities `x` and `y`
            * (don't include the absolute values as it will automatically calculate this).
            *
            *
            * @example
            * ~~~
            * new Crafty.polygon([50,0],[100,100],[0,100]);
            * new Crafty.polygon([[50,0],[100,100],[0,100]]);
            * ~~~
            */
            parent.polygon = function (poly) {
                if (arguments.length > 1) {
                    poly = Array.prototype.slice.call(arguments, 0);
                }
                this.points = poly;
            };

            parent.polygon.prototype = {
                /**@
                * #.containsPoint
                * @comp Crafty.polygon
                * @sign public Boolean .containsPoint(Number x, Number y)
                * @param x - X position of the point
                * @param y - Y position of the point
                *
                * Method is used to determine if a given point is contained by the polygon.
                *
                * @example
                * ~~~
                * var poly = new Crafty.polygon([50,0],[100,100],[0,100]);
                * poly.containsPoint(50, 50); //TRUE
                * poly.containsPoint(0, 0); //FALSE
                * ~~~
                */
                containsPoint: function (x, y) {
                    var p = this.points, i, j, c = false;

                    for (i = 0, j = p.length - 1; i < p.length; j = i++) {
                        if (((p[i][1] > y) != (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) {
                            c = !c;
                        }
                    }

                    return c;
                },

                /**@
                * #.shift
                * @comp Crafty.polygon
                * @sign public void .shift(Number x, Number y)
                * @param x - Amount to shift the `x` axis
                * @param y - Amount to shift the `y` axis
                *
                * Shifts every single point in the polygon by the specified amount.
                *
                * @example
                * ~~~
                * var poly = new Crafty.polygon([50,0],[100,100],[0,100]);
                * poly.shift(5,5);
                * //[[55,5], [105,5], [5,105]];
                * ~~~
                */
                shift: function (x, y) {
                    var i = 0, l = this.points.length, current;
                    for (; i < l; i++) {
                        current = this.points[i];
                        current[0] += x;
                        current[1] += y;
                    }
                },

                rotate: function (e) {
                    var i = 0, l = this.points.length,
                      current, x, y;

                    for (; i < l; i++) {
                        current = this.points[i];

                        x = e.o.x + (current[0] - e.o.x) * e.cos + (current[1] - e.o.y) * e.sin;
                        y = e.o.y - (current[0] - e.o.x) * e.sin + (current[1] - e.o.y) * e.cos;

                        current[0] = x;
                        current[1] = y;
                    }
                }
            };

            /**@
            * #Crafty.circle
            * @category 2D
            * Circle object used for hitboxes and click maps. Must pass a `x`, a `y` and a `radius` value.
            *
            *@example
            * ~~~
            * var centerX = 5,
            *     centerY = 10,
            *     radius = 25;
            *
            * new Crafty.circle(centerX, centerY, radius);
            * ~~~
            *
            * When creating a circle for an entity, each point should be offset or relative from the entities `x` and `y`
            * (don't include the absolute values as it will automatically calculate this).
            */
            parent.circle = function (x, y, radius) {
                this.x = x;
                this.y = y;
                this.radius = radius;

                // Creates an octagon that approximate the circle for backward compatibility.
                this.points = [];
                var theta;

                for (var i = 0; i < 8; i++) {
                    theta = i * Math.PI / 4;
                    this.points[i] = [this.x + (Math.sin(theta) * radius), this.y + (Math.cos(theta) * radius)];
                }
            };

            parent.circle.prototype = {
                /**@
              * #.containsPoint
              * @comp Crafty.circle
              * @sign public Boolean .containsPoint(Number x, Number y)
              * @param x - X position of the point
              * @param y - Y position of the point
              *
              * Method is used to determine if a given point is contained by the circle.
              *
              * @example
              * ~~~
              * var circle = new Crafty.circle(0, 0, 10);
              * circle.containsPoint(0, 0); //TRUE
              * circle.containsPoint(50, 50); //FALSE
              * ~~~
              */
                containsPoint: function (x, y) {
                    var radius = this.radius,
                            sqrt = Math.sqrt,
                            deltaX = this.x - x,
                            deltaY = this.y - y;

                    return (deltaX * deltaX + deltaY * deltaY) < (radius * radius);
                },

                /**@
                * #.shift
                * @comp Crafty.circle
                * @sign public void .shift(Number x, Number y)
                * @param x - Amount to shift the `x` axis
                * @param y - Amount to shift the `y` axis
                *
                * Shifts the circle by the specified amount.
                *
                * @example
                * ~~~
                * var poly = new Crafty.circle(0, 0, 10);
                * circle.shift(5,5);
                * //{x: 5, y: 5, radius: 10};
                * ~~~
                */
                shift: function (x, y) {
                    this.x += x;
                    this.y += y;

                    var i = 0, l = this.points.length, current;
                    for (; i < l; i++) {
                        current = this.points[i];
                        current[0] += x;
                        current[1] += y;
                    }
                },

                rotate: function () {
                    // We are a circle, we don't have to rotate :)
                }
            };


            parent.matrix = function (m) {
                this.mtx = m;
                this.width = m[0].length;
                this.height = m.length;
            };

            parent.matrix.prototype = {
                x: function (other) {
                    if (this.width != other.height) {
                        return;
                    }

                    var result = [];
                    for (var i = 0; i < this.height; i++) {
                        result[i] = [];
                        for (var j = 0; j < other.width; j++) {
                            var sum = 0;
                            for (var k = 0; k < this.width; k++) {
                                sum += this.mtx[i][k] * other.mtx[k][j];
                            }
                            result[i][j] = sum;
                        }
                    }
                    return new parent.matrix(result);
                },


                e: function (row, col) {
                    //test if out of bounds
                    if (row < 1 || row > this.mtx.length || col < 1 || col > this.mtx[0].length) return null;
                    return this.mtx[row - 1][col - 1];
                }
            };
        })(Crafty);
        (function (parent) {
            /**@
            * #Collision
            * @category 2D
            * Component to detect collision between any two convex polygons.
            */
            parent.c("Collision", {
                /**@
                * #.init
                * @comp Collision
                * Create a rectangle polygon based on the x, y, w, h dimensions.
                *
                * You must ensure that the x, y, w, h properties are set before the init function is called. If you have a Car component that sets these properties you should create your entity like this
                * ~~~
                * Crafty.e('2D, DOM, Car, Collision');
                * ~~~
                * And not like
                * ~~~
                * Crafty.e('2D, DOM, Collision, Car');
                * ~~~
                */
                init: function () {
                    this.requires("2D");
                    var area = this._mbr || this;

                    var poly = new parent.polygon([0, 0], [area._w, 0], [area._w, area._h], [0, area._h]);
                    this.map = poly;
                    this.attach(this.map);
                    this.map.shift(area._x, area._y);
                },

                /**@
                * #.collision
                * @comp Collision
                * 
                * @sign public this .collision([Crafty.polygon polygon])
                * @param polygon - Crafty.polygon object that will act as the hit area
                * 
                * @sign public this .collision(Array point1, .., Array pointN)
                * @param point# - Array with an `x` and `y` position to generate a polygon
                * 
                * Constructor takes a polygon or array of points to use as the hit area.
                *
                * The hit area (polygon) must be a convex shape and not concave
                * for the collision detection to work.
                *
                * If no hit area is specified x, y, w, h properties of the entity will be used.
                * 
                * @example
                * ~~~
                * Crafty.e("2D, Collision").collision(
                *     new Crafty.polygon([50,0], [100,100], [0,100])
                * );
                * 
                * Crafty.e("2D, Collision").collision([50,0], [100,100], [0,100]);
                * ~~~
                * 
                * @see Crafty.polygon
                */
                collision: function (poly) {
                    var area = this._mbr || this;

                    if (!poly) {
                        poly = new parent.polygon([0, 0], [area._w, 0], [area._w, area._h], [0, area._h]);
                    }

                    if (arguments.length > 1) {
                        //convert args to array to create polygon
                        var args = Array.prototype.slice.call(arguments, 0);
                        poly = new parent.polygon(args);
                    }

                    this.map = poly;
                    this.attach(this.map);
                    this.map.shift(area._x, area._y);

                    return this;
                },

                /**@
                * #.hit
                * @comp Collision
                * @sign public Boolean/Array hit(String component)
                * @param component - Check collision with entities that has this component
                * @return `false` if no collision. If a collision is detected, returns an Array of objects that are colliding.
                * 
                * Takes an argument for a component to test collision for. If a collision is found, an array of
                * every object in collision along with the amount of overlap is passed.
                *
                * If no collision, will return false. The return collision data will be an Array of Objects with the
                * type of collision used, the object collided and if the type used was SAT (a polygon was used as the hitbox) then an amount of overlap.\
                * ~~~
                * [{
                *    obj: [entity],
                *    type "MBR" or "SAT",
                *    overlap: [number]
                * }]
                * ~~~
                * `MBR` is your standard axis aligned rectangle intersection (`.intersect` in the 2D component).
                * `SAT` is collision between any convex polygon.
                * 
                * @see .onHit, 2D
                */
                hit: function (comp) {
                    var area = this._mbr || this,
                        results = parent.map.search(area, false),
                        i = 0, l = results.length,
                        dupes = {},
                        id, obj, oarea, key,
                        hasMap = ('map' in this && 'containsPoint' in this.map),
                        finalresult = [];

                    if (!l) {
                        return false;
                    }

                    for (; i < l; ++i) {
                        obj = results[i];
                        oarea = obj._mbr || obj; //use the mbr

                        if (!obj) continue;
                        id = obj[0];

                        //check if not added to hash and that actually intersects
                        if (!dupes[id] && this[0] !== id && obj.__c[comp] &&
                                oarea._x < area._x + area._w && oarea._x + oarea._w > area._x &&
                                oarea._y < area._y + area._h && oarea._h + oarea._y > area._y) {
                            dupes[id] = obj;
                        }
                    }

                    for (key in dupes) {
                        obj = dupes[key];

                        if (hasMap && 'map' in obj) {
                            var SAT = this._SAT(this.map, obj.map);
                            SAT.obj = obj;
                            SAT.type = "SAT";
                            if (SAT) finalresult.push(SAT);
                        } else {
                            finalresult.push({ obj: obj, type: "MBR" });
                        }
                    }

                    if (!finalresult.length) {
                        return false;
                    }

                    return finalresult;
                },

                /**@
                * #.onHit
                * @comp Collision
                * @sign public this .onHit(String component, Function hit[, Function noHit])
                * @param component - Component to check collisions for
                * @param hit - Callback method to execute when collided with component
                * @param noHit - Callback method executed once as soon as collision stops
                * 
                * Creates an enterframe event calling .hit() each time and if collision detected will invoke the callback.
                * 
                * @see .hit
                */
                onHit: function (comp, callback, callbackOff) {
                    var justHit = false;
                    this.bind("EnterFrame", function () {
                        var hitdata = this.hit(comp);
                        if (hitdata) {
                            justHit = true;
                            callback.call(this, hitdata);
                        } else if (justHit) {
                            if (typeof callbackOff == 'function') {
                                callbackOff.call(this);
                            }
                            justHit = false;
                        }
                    });
                    return this;
                },

                _SAT: function (poly1, poly2) {
                    var points1 = poly1.points,
                        points2 = poly2.points,
                        i = 0, l = points1.length,
                        j, k = points2.length,
                        normal = { x: 0, y: 0 },
                        length,
                        min1, min2,
                        max1, max2,
                        interval,
                        MTV = null,
                        MTV2 = null,
                        MN = null,
                        dot,
                        nextPoint,
                        currentPoint;

                    //loop through the edges of Polygon 1
                    for (; i < l; i++) {
                        nextPoint = points1[(i == l - 1 ? 0 : i + 1)];
                        currentPoint = points1[i];

                        //generate the normal for the current edge
                        normal.x = -(nextPoint[1] - currentPoint[1]);
                        normal.y = (nextPoint[0] - currentPoint[0]);

                        //normalize the vector
                        length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
                        normal.x /= length;
                        normal.y /= length;

                        //default min max
                        min1 = min2 = -1;
                        max1 = max2 = -1;

                        //project all vertices from poly1 onto axis
                        for (j = 0; j < l; ++j) {
                            dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
                            if (dot > max1 || max1 === -1) max1 = dot;
                            if (dot < min1 || min1 === -1) min1 = dot;
                        }

                        //project all vertices from poly2 onto axis
                        for (j = 0; j < k; ++j) {
                            dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
                            if (dot > max2 || max2 === -1) max2 = dot;
                            if (dot < min2 || min2 === -1) min2 = dot;
                        }

                        //calculate the minimum translation vector should be negative
                        if (min1 < min2) {
                            interval = min2 - max1;

                            normal.x = -normal.x;
                            normal.y = -normal.y;
                        } else {
                            interval = min1 - max2;
                        }

                        //exit early if positive
                        if (interval >= 0) {
                            return false;
                        }

                        if (MTV === null || interval > MTV) {
                            MTV = interval;
                            MN = { x: normal.x, y: normal.y };
                        }
                    }

                    //loop through the edges of Polygon 2
                    for (i = 0; i < k; i++) {
                        nextPoint = points2[(i == k - 1 ? 0 : i + 1)];
                        currentPoint = points2[i];

                        //generate the normal for the current edge
                        normal.x = -(nextPoint[1] - currentPoint[1]);
                        normal.y = (nextPoint[0] - currentPoint[0]);

                        //normalize the vector
                        length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
                        normal.x /= length;
                        normal.y /= length;

                        //default min max
                        min1 = min2 = -1;
                        max1 = max2 = -1;

                        //project all vertices from poly1 onto axis
                        for (j = 0; j < l; ++j) {
                            dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
                            if (dot > max1 || max1 === -1) max1 = dot;
                            if (dot < min1 || min1 === -1) min1 = dot;
                        }

                        //project all vertices from poly2 onto axis
                        for (j = 0; j < k; ++j) {
                            dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
                            if (dot > max2 || max2 === -1) max2 = dot;
                            if (dot < min2 || min2 === -1) min2 = dot;
                        }

                        //calculate the minimum translation vector should be negative
                        if (min1 < min2) {
                            interval = min2 - max1;

                            normal.x = -normal.x;
                            normal.y = -normal.y;
                        } else {
                            interval = min1 - max2;


                        }

                        //exit early if positive
                        if (interval >= 0) {
                            return false;
                        }

                        if (MTV === null || interval > MTV) MTV = interval;
                        if (interval > MTV2 || MTV2 === null) {
                            MTV2 = interval;
                            MN = { x: normal.x, y: normal.y };
                        }
                    }

                    return { overlap: MTV2, normal: MN };
                }
            });
        })(Crafty);
        /**@
        * #Crafty.support
        * @category Misc, Core
        * Determines feature support for what Crafty can do.
        */

        (function (parent) {
            parent.support = {};
            /**@
            * #Crafty.support.setter
            * @comp Crafty.support
            * Is `__defineSetter__` supported?
            */
            parent.support.setter = ('__defineSetter__' in this && '__defineGetter__' in this);

            /**@
            * #Crafty.support.defineProperty
            * @comp Crafty.support
            * Is `Object.defineProperty` supported?
            */
            parent.support.defineProperty = (function () {
                if (!('defineProperty' in Object)) return false;
                try { Object.defineProperty({}, 'x', {}); }
                catch (e) { return false }
                return true;
            })();

        })(Crafty);

        Crafty.extend({

            zeroFill: function (number, width) {
                width -= number.toString().length;
                if (width > 0)
                    return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
                return number.toString();
            },

            _events: {},

            /**@
            * #Crafty.keys
            * @category Input
            * Object of key names and the corresponding key code.
            * 
            * ~~~
            * BACKSPACE: 8,
            * TAB: 9,
            * ENTER: 13,
            * PAUSE: 19,
            * CAPS: 20,
            * ESC: 27,
            * SPACE: 32,
            * PAGE_UP: 33,
            * PAGE_DOWN: 34,
            * END: 35,
            * HOME: 36,
            * LEFT_ARROW: 37,
            * UP_ARROW: 38,
            * RIGHT_ARROW: 39,
            * DOWN_ARROW: 40,
            * INSERT: 45,
            * DELETE: 46,
            * 0: 48,
            * 1: 49,
            * 2: 50,
            * 3: 51,
            * 4: 52,
            * 5: 53,
            * 6: 54,
            * 7: 55,
            * 8: 56,
            * 9: 57,
            * A: 65,
            * B: 66,
            * C: 67,
            * D: 68,
            * E: 69,
            * F: 70,
            * G: 71,
            * H: 72,
            * I: 73,
            * J: 74,
            * K: 75,
            * L: 76,
            * M: 77,
            * N: 78,
            * O: 79,
            * P: 80,
            * Q: 81,
            * R: 82,
            * S: 83,
            * T: 84,
            * U: 85,
            * V: 86,
            * W: 87,
            * X: 88,
            * Y: 89,
            * Z: 90,
            * NUMPAD_0: 96,
            * NUMPAD_1: 97,
            * NUMPAD_2: 98,
            * NUMPAD_3: 99,
            * NUMPAD_4: 100,
            * NUMPAD_5: 101,
            * NUMPAD_6: 102,
            * NUMPAD_7: 103,
            * NUMPAD_8: 104,
            * NUMPAD_9: 105,
            * MULTIPLY: 106,
            * ADD: 107,
            * SUBSTRACT: 109,
            * DECIMAL: 110,
            * DIVIDE: 111,
            * F1: 112,
            * F2: 113,
            * F3: 114,
            * F4: 115,
            * F5: 116,
            * F6: 117,
            * F7: 118,
            * F8: 119,
            * F9: 120,
            * F10: 121,
            * F11: 122,
            * F12: 123,
            * SHIFT: 16,
            * CTRL: 17,
            * ALT: 18,
            * PLUS: 187,
            * COMMA: 188,
            * MINUS: 189,
            * PERIOD: 190,
            * PULT_UP: 29460,
            * PULT_DOWN: 29461,
            * PULT_LEFT: 4,
            * PULT_RIGHT': 5
            * ~~~
            */
            keys: {
                'BACKSPACE': 8,
                'TAB': 9,
                'ENTER': 13,
                'PAUSE': 19,
                'CAPS': 20,
                'ESC': 27,
                'SPACE': 32,
                'PAGE_UP': 33,
                'PAGE_DOWN': 34,
                'END': 35,
                'HOME': 36,
                'LEFT_ARROW': 37,
                'UP_ARROW': 38,
                'RIGHT_ARROW': 39,
                'DOWN_ARROW': 40,
                'INSERT': 45,
                'DELETE': 46,
                '0': 48,
                '1': 49,
                '2': 50,
                '3': 51,
                '4': 52,
                '5': 53,
                '6': 54,
                '7': 55,
                '8': 56,
                '9': 57,
                'A': 65,
                'B': 66,
                'C': 67,
                'D': 68,
                'E': 69,
                'F': 70,
                'G': 71,
                'H': 72,
                'I': 73,
                'J': 74,
                'K': 75,
                'L': 76,
                'M': 77,
                'N': 78,
                'O': 79,
                'P': 80,
                'Q': 81,
                'R': 82,
                'S': 83,
                'T': 84,
                'U': 85,
                'V': 86,
                'W': 87,
                'X': 88,
                'Y': 89,
                'Z': 90,
                'NUMPAD_0': 96,
                'NUMPAD_1': 97,
                'NUMPAD_2': 98,
                'NUMPAD_3': 99,
                'NUMPAD_4': 100,
                'NUMPAD_5': 101,
                'NUMPAD_6': 102,
                'NUMPAD_7': 103,
                'NUMPAD_8': 104,
                'NUMPAD_9': 105,
                'MULTIPLY': 106,
                'ADD': 107,
                'SUBSTRACT': 109,
                'DECIMAL': 110,
                'DIVIDE': 111,
                'F1': 112,
                'F2': 113,
                'F3': 114,
                'F4': 115,
                'F5': 116,
                'F6': 117,
                'F7': 118,
                'F8': 119,
                'F9': 120,
                'F10': 121,
                'F11': 122,
                'F12': 123,
                'SHIFT': 16,
                'CTRL': 17,
                'ALT': 18,
                'PLUS': 187,
                'COMMA': 188,
                'MINUS': 189,
                'PERIOD': 190,
                'PULT_UP': 29460,
                'PULT_DOWN': 29461,
                'PULT_LEFT': 4,
                'PULT_RIGHT': 5

            },

            /**@
            * #Crafty.mouseButtons
            * @category Input
            * Object of mouseButton names and the corresponding button ID.
            * In all mouseEvents we add the e.mouseButton property with a value normalized to match e.button of modern webkit
            * 
            * ~~~
            * LEFT: 0,
            * MIDDLE: 1,
            * RIGHT: 2
            * ~~~
            */
            mouseButtons: {
                LEFT: 0,
                MIDDLE: 1,
                RIGHT: 2
            }
        });
        Crafty.extend({
            over: null, //object mouseover, waiting for out
            mouseObjs: 0,
            mousePos: {},
            lastEvent: null,
            keydown: {},
            selected: false,

            simulateBlur: function (simulatedEvent) {
                if (simulatedEvent.blur)
                    Crafty.trigger("CraftyFocus");
                else
                    Crafty.trigger("CraftyBlur");

                Crafty.selected = simulatedEvent.blur;
            },

            simulateMouse: function (simulatedEvent) {
                if (!Crafty.mouseObjs) return;
                Crafty.lastEvent = simulatedEvent;

                var maxz = -1,
                    closest,
                    q,
                    i = 0, l,
                    pos = { x: simulatedEvent.x, y: simulatedEvent.y },
                    x, y,
                    dupes = {},
                    type = simulatedEvent.type;

                //Normalize button according to http://unixpapa.com/js/mouse.html
                simulatedEvent.mouseButton = (simulatedEvent.which < 2) ? Crafty.mouseButtons.LEFT : ((simulatedEvent.which == 2) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);

                simulatedEvent.realX = x = Crafty.mousePos.x = pos.x;
                simulatedEvent.realY = y = Crafty.mousePos.y = pos.y;

                var entTargetID = simulatedEvent.entityTargetID;
                if (entTargetID !== null) {
                    var ent = Crafty(entTargetID);
                    if (ent.has('Mouse') && ent.isAt(x, y)) {
                        closest = ent;
                    }
                }

                //else we search for an entity with Mouse component
                if (!closest) {
                    q = Crafty.map.search({ _x: x, _y: y, _w: 1, _h: 1 }, false);

                    for (l = q.length; i < l; ++i) {
                        if (!q[i].__c.Mouse || !q[i]._visible) continue;

                        var current = q[i],
                            flag = false;

                        //weed out duplicates
                        if (dupes[current[0]]) continue;
                        else dupes[current[0]] = true;

                        if (current.mapArea) {
                            if (current.mapArea.containsPoint(x, y)) {
                                flag = true;
                            }
                        } else if (current.isAt(x, y)) flag = true;

                        if (flag && (current._z >= maxz || maxz === -1)) {
                            //if the Z is the same, select the closest GUID
                            if (current._z === maxz && current[0] < closest[0]) {
                                continue;
                            }
                            maxz = current._z;
                            closest = current;
                        }
                    }
                }

                //found closest object to mouse
                if (closest) {
                    //click must mousedown and out on tile
                    if (type === "mousedown") {
                        closest.trigger("MouseDown", simulatedEvent);
                    } else if (type === "mouseup") {
                        closest.trigger("MouseUp", simulatedEvent);
                    } else if (type == "dblclick") {
                        closest.trigger("DoubleClick", simulatedEvent);
                    } else if (type == "click") {
                        closest.trigger("Click", simulatedEvent);
                    } else if (type === "mousemove") {
                        closest.trigger("MouseMove", simulatedEvent);
                        if (this.over !== closest) { //if new mousemove, it is over
                            if (this.over) {
                                this.over.trigger("MouseOut", simulatedEvent); //if over wasn't null, send mouseout
                                this.over = null;
                            }
                            this.over = closest;
                            closest.trigger("MouseOver", simulatedEvent);
                        }
                    } else closest.trigger(type, simulatedEvent); //trigger whatever it is
                } else {
                    if (type === "mousemove" && this.over) {
                        this.over.trigger("MouseOut", simulatedEvent);
                        this.over = null;
                    }
                }

                if (type === "mousemove") {
                    this.lastEvent = simulatedEvent;
                }

            },


            /**@
            * #Crafty.touchDispatch
            * @category Input
            * 
            * TouchEvents have a different structure then MouseEvents.
            * The relevant data lives in e.changedTouches[0].
            * To normalize TouchEvents we catch em and dispatch a mock MouseEvent instead.
            * 
            * @see Crafty.mouseDispatch
            */

            //    touchDispatch: function(e) {
            //        var type,
            //            lastEvent = Crafty.lastEvent;
            //
            //        if (e.type === "touchstart") type = "mousedown";
            //        else if (e.type === "touchmove") type = "mousemove";
            //        else if (e.type === "touchend") type = "mouseup";
            //        else if (e.type === "touchcancel") type = "mouseup";
            //        else if (e.type === "touchleave") type = "mouseup";
            //        
            //        if(e.touches && e.touches.length) {
            //            first = e.touches[0];
            //        } else if(e.changedTouches && e.changedTouches.length) {
            //            first = e.changedTouches[0];
            //        }
            //
            //        var simulatedEvent = document.createEvent("MouseEvent");
            //        simulatedEvent.initMouseEvent(type, true, true, window, 1,
            //            first.screenX, 
            //            first.screenY,
            //            first.clientX, 
            //            first.clientY, 
            //            false, false, false, false, 0, e.relatedTarget
            //        );
            //
            //        first.target.dispatchEvent(simulatedEvent);
            //
            //        // trigger click when it should be triggered
            //        if (lastEvent != null && lastEvent.type == 'mousedown' && type == 'mouseup') {
            //            type = 'click';
            //
            //            var simulatedEvent = document.createEvent("MouseEvent");
            //            simulatedEvent.initMouseEvent(type, true, true, window, 1,
            //                first.screenX, 
            //                first.screenY,
            //                first.clientX, 
            //                first.clientY, 
            //                false, false, false, false, 0, e.relatedTarget
            //            );
            //            first.target.dispatchEvent(simulatedEvent);
            //        }
            //
            //        if(e.preventDefault) e.preventDefault();
            //        else e.returnValue = false;
            //    },


            /**@
            * #KeyboardEvent
            * @category Input
            * Keyboard Event triggered by Crafty Core
            * @trigger KeyDown - is triggered for each entity when the DOM 'keydown' event is triggered.
            * @trigger KeyUp - is triggered for each entity when the DOM 'keyup' event is triggered.
            * 
            * @example
            * ~~~
            * Crafty.e("2D, DOM, Color")
            *   .attr({x: 100, y: 100, w: 50, h: 50})
            *   .color("red")
            *   .bind('KeyDown', function(e) {
            *     if(e.key == Crafty.keys['LEFT_ARROW']) {
            *       this.x=this.x-1;
            *     } else if (e.key == Crafty.keys['RIGHT_ARROW']) {
            *     this.x=this.x+1;
            *     } else if (e.key == Crafty.keys['UP_ARROW']) {
            *     this.y=this.y-1;
            *     } else if (e.key == Crafty.keys['DOWN_ARROW']) {
            *     this.y=this.y+1;
            *     }
            *   });
            * ~~~
            * 
            * @see Crafty.keys
            */

            /**@
            * #Crafty.eventObject
            * @category Input
            * 
            * Event Object used in Crafty for cross browser compatibility
            */

            /**@
            * #.key
            * @comp Crafty.eventObject
            * 
            * Unicode of the key pressed
            */
            simulateKeyboard: function (simulatedEvent) {
                // Use a Crafty-standard event object to avoid cross-browser issues
                var original = simulatedEvent,
                    evnt = {},
                    props = "char charCode keyCode type shiftKey ctrlKey metaKey timestamp".split(" ");
                for (var i = props.length; i;) {
                    var prop = props[--i];
                    evnt[prop] = original[prop];
                }
                evnt.which = original.charCode !== null ? original.charCode : original.keyCode;
                evnt.key = original.keyCode || original.which;
                evnt.originalEvent = original;
                var e = evnt;

                if (e.type === "keydown") {
                    if (Crafty.keydown[e.key] !== true) {
                        Crafty.keydown[e.key] = true;
                        Crafty.trigger("KeyDown", e);
                    }
                } else if (e.type === "keyup") {
                    delete Crafty.keydown[e.key];
                    Crafty.trigger("KeyUp", e);
                }
            }
        });

        /**@
        * #Mouse
        * @category Input
        * Provides the entity with mouse related events
        * @trigger MouseOver - when the mouse enters the entity - MouseEvent
        * @trigger MouseOut - when the mouse leaves the entity - MouseEvent
        * @trigger MouseDown - when the mouse button is pressed on the entity - MouseEvent
        * @trigger MouseUp - when the mouse button is released on the entity - MouseEvent
        * @trigger Click - when the user clicks the entity. [See documentation](http://www.quirksmode.org/dom/events/click.html) - MouseEvent
        * @trigger DoubleClick - when the user double clicks the entity - MouseEvent
        * @trigger MouseMove - when the mouse is over the entity and moves - MouseEvent
        * Crafty adds the mouseButton property to MouseEvents that match one of
        *
        * ~~~
        * - Crafty.mouseButtons.LEFT
        * - Crafty.mouseButtons.RIGHT
        * - Crafty.mouseButtons.MIDDLE
        * ~~~
        * 
        * @example
        * ~~~
        * myEntity.bind('Click', function() {
        *      console.log("Clicked!!");
        * })
        *
        * myEntity.bind('MouseUp', function(e) {
        *    if( e.mouseButton == Crafty.mouseButtons.RIGHT )
        *        console.log("Clicked right button");
        * })
        * ~~~
        */
        Crafty.c("Mouse", {
            init: function () {
                Crafty.mouseObjs++;
                this.bind("Remove", function () {
                    Crafty.mouseObjs--;
                });
            },

            /**@
            * #.areaMap
            * @comp Mouse
            * @sign public this .areaMap(Crafty.polygon polygon)
            * @param polygon - Instance of Crafty.polygon used to check if the mouse coordinates are inside this region
            * @sign public this .areaMap(Array point1, .., Array pointN)
            * @param point# - Array with an `x` and `y` position to generate a polygon
            * 
            * Assign a polygon to the entity so that mouse events will only be triggered if
            * the coordinates are inside the given polygon.
            * 
            * @example
            * ~~~
            * Crafty.e("2D, DOM, Color, Mouse")
            *     .color("red")
            *     .attr({ w: 100, h: 100 })
            *     .bind('MouseOver', function() {console.log("over")})
            *     .areaMap([0,0], [50,0], [50,50], [0,50])
            * ~~~
            * 
            * @see Crafty.polygon
            */
            areaMap: function (poly) {
                //create polygon
                if (arguments.length > 1) {
                    //convert args to array to create polygon
                    var args = Array.prototype.slice.call(arguments, 0);
                    poly = new Crafty.polygon(args);
                }

                poly.shift(this._x, this._y);
                //this.map = poly;
                this.mapArea = poly;

                this.attach(this.mapArea);
                return this;
            }
        });

        /**@
        * #Keyboard
        * @category Input
        * Give entities keyboard events (`keydown` and `keyup`).
        */
        Crafty.c("Keyboard", {
            /**@
                * #.isDown
                * @comp Keyboard
                * @sign public Boolean isDown(String keyName)
                * @param keyName - Name of the key to check. See `Crafty.keys`.
                * @sign public Boolean isDown(Number keyCode)
                * @param keyCode - Key code in `Crafty.keys`.
                * 
                * Determine if a certain key is currently down.
                * 
                * @example
                * ~~~
                * entity.requires('Keyboard').bind('KeyDown', function () { if (this.isDown('SPACE')) jump(); });
                * ~~~
                * 
                * @see Crafty.keys
                */
            isDown: function (key) {
                if (typeof key === "string") {
                    key = Crafty.keys[key];
                }
                return !!Crafty.keydown[key];
            }
        });

        /**@
        * #Multiway
        * @category Input
        * Used to bind keys to directions and have the entity move accordingly
        * @trigger NewDirection - triggered when direction changes - { x:Number, y:Number } - New direction
        * @trigger Moved - triggered on movement on either x or y axis. If the entity has moved on both axes for diagonal movement the event is triggered twice - { x:Number, y:Number } - Old position
        */
        Crafty.c("Multiway", {
            _speed: 3,

            _keydown: function (e) {
                if (this._keys[e.key]) {
                    this._movement.x = Math.round((this._movement.x + this._keys[e.key].x) * 1000) / 1000;
                    this._movement.y = Math.round((this._movement.y + this._keys[e.key].y) * 1000) / 1000;
                    this.trigger('NewDirection', this._movement);
                }
            },

            _keyup: function (e) {
                if (this._keys[e.key]) {
                    this._movement.x = Math.round((this._movement.x - this._keys[e.key].x) * 1000) / 1000;
                    this._movement.y = Math.round((this._movement.y - this._keys[e.key].y) * 1000) / 1000;
                    this.trigger('NewDirection', this._movement);
                }
            },

            _enterframe: function () {
                if (this.disableControls) return;

                if (this._movement.x !== 0) {
                    this.x += this._movement.x;
                    this.trigger('Moved', { x: this.x - this._movement.x, y: this.y });
                }
                if (this._movement.y !== 0) {
                    this.y += this._movement.y;
                    this.trigger('Moved', { x: this.x, y: this.y - this._movement.y });
                }
            },

            /**@
            * #.multiway
            * @comp Multiway
            * @sign public this .multiway([Number speed,] Object keyBindings )
            * @param speed - Amount of pixels to move the entity whilst a key is down
            * @param keyBindings - What keys should make the entity go in which direction. Direction is specified in degrees
            * Constructor to initialize the speed and keyBindings. Component will listen to key events and move the entity appropriately.
            *
            * When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}
            * When entity has moved on either x- or y-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
            * 
            * @example
            * ~~~
            * this.multiway(3, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
            * this.multiway({x:3,y:1.5}, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
            * this.multiway({W: -90, S: 90, D: 0, A: 180});
            * ~~~
            */
            multiway: function (speed, keys) {
                this._keyDirection = {};
                this._keys = {};
                this._movement = { x: 0, y: 0 };
                this._speed = { x: 3, y: 3 };

                if (keys) {
                    if (speed.x && speed.y) {
                        this._speed.x = speed.x;
                        this._speed.y = speed.y;
                    } else {
                        this._speed.x = speed;
                        this._speed.y = speed;
                    }
                } else {
                    keys = speed;
                }

                this._keyDirection = keys;
                this.speed(this._speed);

                this.disableControl();
                this.enableControl();

                //Apply movement if key is down when created
                for (var k in keys) {
                    if (Crafty.keydown[Crafty.keys[k]]) {
                        this.trigger("KeyDown", { key: Crafty.keys[k] });
                    }
                }

                return this;
            },

            /**@
            * #.enableControl
            * @comp Multiway
            * @sign public this .enableControl()
            * 
            * Enable the component to listen to key events.
            *
            * @example
            * ~~~
            * this.enableControl();
            * ~~~
            */
            enableControl: function () {
                this.bind("KeyDown", this._keydown)
                .bind("KeyUp", this._keyup)
                .bind("EnterFrame", this._enterframe);
                return this;
            },

            /**@
            * #.disableControl
            * @comp Multiway
            * @sign public this .disableControl()
            * 
            * Disable the component to listen to key events.
            *
            * @example
            * ~~~
            * this.disableControl();
            * ~~~
            */

            disableControl: function () {
                this.unbind("KeyDown", this._keydown)
                .unbind("KeyUp", this._keyup)
                .unbind("EnterFrame", this._enterframe);
                return this;
            },

            speed: function (speed) {
                for (var k in this._keyDirection) {
                    var keyCode = Crafty.keys[k] || k;
                    this._keys[keyCode] = {
                        x: Math.round(Math.cos(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.x) / 1000,
                        y: Math.round(Math.sin(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.y) / 1000
                    };
                }
                return this;
            }
        });

        /**@
        * #Fourway
        * @category Input
        * Move an entity in four directions by using the
        * arrow keys or `W`, `A`, `S`, `D`.
        */
        Crafty.c("Fourway", {

            init: function () {
                this.requires("Multiway");
            },

            /**@
            * #.fourway
            * @comp Fourway
            * @sign public this .fourway(Number speed)
            * @param speed - Amount of pixels to move the entity whilst a key is down
            * Constructor to initialize the speed. Component will listen for key events and move the entity appropriately.
            * This includes `Up Arrow`, `Right Arrow`, `Down Arrow`, `Left Arrow` as well as `W`, `A`, `S`, `D`.
            *
            * When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}
            * When entity has moved on either x- or y-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
            *
            * The key presses will move the entity in that direction by the speed passed in the argument.
            * 
            * @see Multiway
            */
            fourway: function (speed) {
                this.multiway(speed, {
                    UP_ARROW: -90,
                    DOWN_ARROW: 90,
                    RIGHT_ARROW: 0,
                    LEFT_ARROW: 180,
                    W: -90,
                    S: 90,
                    D: 0,
                    A: 180,
                    Z: -90,
                    Q: 180
                });

                return this;
            }
        });

        /**@
        * #Twoway
        * @category Input
        * Move an entity left or right using the arrow keys or `D` and `A` and jump using up arrow or `W`.
        *
        * When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}. This is consistent with Fourway and Multiway components.
        * When entity has moved on x-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
        */
        Crafty.c("Twoway", {
            _speed: 3,
            _up: false,

            init: function () {
                this.requires("Fourway, Keyboard");
            },

            /**@
            * #.twoway
            * @comp Twoway
            * @sign public this .twoway(Number speed[, Number jumpSpeed])
            * @param speed - Amount of pixels to move left or right
            * @param jumpSpeed - How high the entity should jump
            * 
            * Constructor to initialize the speed and power of jump. Component will
            * listen for key events and move the entity appropriately. This includes
            * ~~~
            * `Up Arrow`, `Right Arrow`, `Left Arrow` as well as W, A, D. Used with the
            * `gravity` component to simulate jumping.
            * ~~~
            * 
            * The key presses will move the entity in that direction by the speed passed in
            * the argument. Pressing the `Up Arrow` or `W` will cause the entity to jump.
            * 
            * @see Gravity, Fourway
            */
            twoway: function (speed, jump) {

                this.multiway(speed, {
                    RIGHT_ARROW: 0,
                    LEFT_ARROW: 180,
                    D: 0,
                    A: 180,
                    Q: 180
                });

                if (speed) this._speed = speed;
                jump = jump || this._speed * 2;

                this.bind("EnterFrame", function () {
                    if (this.disableControls) return;
                    if (this._up) {
                        this.y -= jump;
                        this._falling = true;
                    }
                }).bind("KeyDown", function () {
                    if (this.isDown("UP_ARROW") || this.isDown("W") || this.isDown("Z")) this._up = true;
                });

                return this;
            }
        });
        ///**@
        //* #Color
        //* @category Graphics
        //* Draw a solid color for the entity
        //*/
        //Crafty.c("Color", {
        //  _color: "",
        //  ready: true,
        //
        //	init: function () {
        //		this.bind("Draw", function (e) {
        //			if (e.type === "DOM") {
        //				e.style.background = this._color;
        //				e.style.lineHeight = 0;
        //			} else if (e.type === "canvas") {
        //				if (this._color) e.ctx.fillStyle = this._color;
        //				e.ctx.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
        //			}
        //		});
        //	},
        //
        //	/**@
        //	* #.color
        //	* @comp Color
        //	* @trigger Change - when the color changes
        //	* @sign public this .color(String color)
        //	* @sign public String .color()
        //	* @param color - Color of the rectangle
        //	* Will create a rectangle of solid color for the entity, or return the color if no argument is given.
        //	*
        //	* The argument must be a color readable depending on which browser you
        //	* choose to support. IE 8 and below doesn't support the rgb() syntax.
        //	* 
        //	* @example
        //	* ~~~
        //	* Crafty.e("2D, DOM, Color")
        //	*    .color("#969696");
        //	* ~~~
        //	*/
        //	color: function (color) {
        //		if (!color) return this._color;
        //		this._color = color;
        //		this.trigger("Change");
        //		return this;
        //	}
        //});
        //
        ///**@
        //* #Tint
        //* @category Graphics
        //* Similar to Color by adding an overlay of semi-transparent color.
        //*
        //* *Note: Currently only works for Canvas*
        //*/
        //Crafty.c("Tint", {
        //	_color: null,
        //	_strength: 1.0,
        //
        //	init: function () {
        //		var draw = function d(e) {
        //			var context = e.ctx || Crafty.canvas.context;
        //
        //			context.fillStyle = this._color || "rgb(0,0,0)";
        //			context.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
        //		};
        //
        //		this.bind("Draw", draw).bind("RemoveComponent", function (id) {
        //			if (id === "Tint") this.unbind("Draw", draw);
        //		});
        //	},
        //
        //	/**@
        //	* #.tint
        //	* @comp Tint
        //	* @trigger Change - when the tint is applied
        //	* @sign public this .tint(String color, Number strength)
        //	* @param color - The color in hexadecimal
        //	* @param strength - Level of opacity
        //	* 
        //	* Modify the color and level opacity to give a tint on the entity.
        //	* 
        //	* @example
        //	* ~~~
        //	* Crafty.e("2D, Canvas, Tint")
        //	*    .tint("#969696", 0.3);
        //	* ~~~
        //	*/
        //	tint: function (color, strength) {
        //		this._strength = strength;
        //		this._color = Crafty.toRGB(color, this._strength);
        //
        //		this.trigger("Change");
        //		return this;
        //	}
        //});
        //
        ///**@
        //* #Image
        //* @category Graphics
        //* Draw an image with or without repeating (tiling).
        //*/
        //Crafty.c("Image", {
        //	_repeat: "repeat",
        //	ready: false,
        //
        //	init: function () {
        //		var draw = function (e) {
        //			if (e.type === "canvas") {
        //				//skip if no image
        //				if (!this.ready || !this._pattern) return;
        //
        //				var context = e.ctx;
        //				
        //				context.fillStyle = this._pattern;
        //				
        //				context.save();
        //				context.translate(e.pos._x, e.pos._y);
        //				context.fillRect(0, 0, this._w, this._h);
        //				context.restore();
        //			} else if (e.type === "DOM") {
        //				if (this.__image)
        //					e.style.background = "url(" + this.__image + ") " + this._repeat;
        //			}
        //		};
        //
        //		this.bind("Draw", draw).bind("RemoveComponent", function (id) {
        //			if (id === "Image") this.unbind("Draw", draw);
        //		});
        //	},
        //
        //	/**@
        //	* #.image
        //	* @comp Image
        //	* @trigger Change - when the image is loaded
        //	* @sign public this .image(String url[, String repeat])
        //	* @param url - URL of the image
        //	* @param repeat - If the image should be repeated to fill the entity.
        //	* 
        //	* Draw specified image. Repeat follows CSS syntax (`"no-repeat", "repeat", "repeat-x", "repeat-y"`);
        //	*
        //	* *Note: Default repeat is `no-repeat` which is different to standard DOM (which is `repeat`)*
        //	*
        //	* If the width and height are `0` and repeat is set to `no-repeat` the width and
        //	* height will automatically assume that of the image. This is an
        //	* easy way to create an image without needing sprites.
        //	* 
        //	* @example
        //	* Will default to no-repeat. Entity width and height will be set to the images width and height
        //	* ~~~
        //	* var ent = Crafty.e("2D, DOM, Image").image("myimage.png");
        //	* ~~~
        //	* Create a repeating background.
        //	* ~~~
        //	* var bg = Crafty.e("2D, DOM, Image")
        //	*              .attr({w: Crafty.viewport.width, h: Crafty.viewport.height})
        //	*              .image("bg.png", "repeat");
        //	* ~~~
        //	* 
        //	* @see Crafty.sprite
        //	*/
        //	image: function (url, repeat) {
        //		this.__image = url;
        //		this._repeat = repeat || "no-repeat";
        //
        //		this.img = Crafty.asset(url);
        //		if (!this.img) {
        //			this.img = new Image();
        //			Crafty.asset(url, this.img);
        //			this.img.src = url;
        //			var self = this;
        //
        //			this.img.onload = function () {
        //				if (self.has("Canvas")) self._pattern = Crafty.canvas.context.createPattern(self.img, self._repeat);
        //				self.ready = true;
        //
        //				if (self._repeat === "no-repeat") {
        //					self.w = self.img.width;
        //					self.h = self.img.height;
        //				}
        //
        //				self.trigger("Change");
        //			};
        //
        //			return this;
        //		} else {
        //			this.ready = true;
        //			if (this.has("Canvas")) this._pattern = Crafty.canvas.context.createPattern(this.img, this._repeat);
        //			if (this._repeat === "no-repeat") {
        //				this.w = this.img.width;
        //				this.h = this.img.height;
        //			}
        //		}
        //
        //
        //		this.trigger("Change");
        //
        //		return this;
        //	}
        //});

        Crafty.extend({
            _scenes: [],
            _current: null,

            /**@
            * #Crafty.scene
            * @category Scenes, Stage
            * @trigger SceneChange - when a scene is played - { oldScene:String, newScene:String }
            * @sign public void Crafty.scene(String sceneName, Function init[, Function uninit])
            * @param sceneName - Name of the scene to add
            * @param init - Function to execute when scene is played
            * @param uninit - Function to execute before next scene is played, after entities with `2D` are destroyed
            * @sign public void Crafty.scene(String sceneName)
            * @param sceneName - Name of scene to play
            * 
            * Method to create scenes on the stage. Pass an ID and function to register a scene.
            *
            * To play a scene, just pass the ID. When a scene is played, all
            * entities with the `2D` component on the stage are destroyed.
            *
            * If you want some entities to persist over scenes (as in not be destroyed)
            * simply add the component `Persist`.
            *
            * @example
            * ~~~
            * Crafty.scene("loading", function() {});
            *
            * Crafty.scene("loading", function() {}, function() {});
            *
            * Crafty.scene("loading");
            * ~~~
            */
            scene: function (name, intro, outro) {
                //play scene
                if (arguments.length === 1) {
                    //Crafty.viewport.reset();
                    Crafty("2D").each(function () {
                        if (!this.has("Persist")) this.destroy();
                    });
                    // uninitialize previous scene
                    if (this._current !== null && 'uninitialize' in this._scenes[this._current]) {
                        this._scenes[this._current].uninitialize.call(this);
                    }
                    // initialize next scene
                    this._scenes[name].initialize.call(this);
                    var oldScene = this._current;
                    this._current = name;
                    Crafty.trigger("SceneChange", { oldScene: oldScene, newScene: name });
                    return;
                }
                //add scene
                this._scenes[name] = {};
                this._scenes[name].initialize = intro;
                if (typeof outro !== 'undefined') {
                    this._scenes[name].uninitialize = outro;
                }
                return;
            },

            /**@
            * #Crafty.toRGB
            * @category Graphics
            * @sign public String Crafty.scene(String hex[, Number alpha])
            * @param hex - a 6 character hex number string representing RGB color
            * @param alpha - The alpha value.
            * 
            * Get a rgb string or rgba string (if `alpha` presents).
            * 
            * @example
            * ~~~
            * Crafty.toRGB("ffffff"); // rgb(255,255,255)
            * Crafty.toRGB("#ffffff"); // rgb(255,255,255)
            * Crafty.toRGB("ffffff", .5); // rgba(255,255,255,0.5)
            * ~~~
            * 
            * @see Text.textColor
            */
            toRGB: function (hex, alpha) {
                hex = (hex.charAt(0) === '#') ? hex.substr(1) : hex;
                var c = [], result;

                c[0] = parseInt(hex.substr(0, 2), 16);
                c[1] = parseInt(hex.substr(2, 2), 16);
                c[2] = parseInt(hex.substr(4, 2), 16);

                result = alpha === undefined ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + alpha + ')';

                return result;
            }
        });

        /**@
        * #Crafty.DrawManager
        * @category Graphics
        * @sign Crafty.DrawManager
        * 
        * An internal object manage objects to be drawn and implement
        * the best method of drawing in both DOM and canvas
        */
        //Crafty.DrawManager = (function () {
        //	/** array of dirty rects on screen */
        //	var dirty_rects = [],
        //	/** array of DOMs needed updating */
        //		dom = [];
        //
        //	return {
        //		/**@
        //		* #Crafty.DrawManager.total2D
        //		* @comp Crafty.DrawManager
        //		* 
        //		* Total number of the entities that have the `2D` component.
        //		*/
        //		total2D: Crafty("2D").length,
        //
        //		/**@
        //		* #Crafty.DrawManager.onScreen
        //		* @comp Crafty.DrawManager
        //		* @sign public Crafty.DrawManager.onScreen(Object rect)
        //		* @param rect - A rectangle with field {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
        //		* 
        //		* Test if a rectangle is completely in viewport
        //		*/
        //		onScreen: function (rect) {
        //			return Crafty.viewport._x + rect._x + rect._w > 0 && Crafty.viewport._y + rect._y + rect._h > 0 &&
        //                    Crafty.viewport._x + rect._x < Crafty.viewport.width && Crafty.viewport._y + rect._y < Crafty.viewport.height;
        //		},
        //
        //		/**@
        //		* #Crafty.DrawManager.merge
        //		* @comp Crafty.DrawManager
        //		* @sign public Object Crafty.DrawManager.merge(Object set)
        //		* @param set - an array of rectangular regions
        //		* 
        //		* Merged into non overlapping rectangular region
        //		* Its an optimization for the redraw regions.
        //		*/
        //		merge: function (set) {
        //			do {
        //				var newset = [], didMerge = false, i = 0,
        //					l = set.length, current, next, merger;
        //
        //				while (i < l) {
        //					current = set[i];
        //					next = set[i + 1];
        //
        //					if (i < l - 1 && current._x < next._x + next._w && current._x + current._w > next._x &&
        //									current._y < next._y + next._h && current._h + current._y > next._y) {
        //
        //						merger = {
        //							_x: ~~Math.min(current._x, next._x),
        //							_y: ~~Math.min(current._y, next._y),
        //							_w: Math.max(current._x, next._x) + Math.max(current._w, next._w),
        //							_h: Math.max(current._y, next._y) + Math.max(current._h, next._h)
        //						};
        //						merger._w = merger._w - merger._x;
        //						merger._h = merger._h - merger._y;
        //						merger._w = (merger._w == ~~merger._w) ? merger._w : merger._w + 1 | 0;
        //						merger._h = (merger._h == ~~merger._h) ? merger._h : merger._h + 1 | 0;
        //
        //						newset.push(merger);
        //
        //						i++;
        //						didMerge = true;
        //					} else newset.push(current);
        //					i++;
        //				}
        //
        //				set = newset.length ? Crafty.clone(newset) : set;
        //
        //				if (didMerge) i = 0;
        //			} while (didMerge);
        //
        //			return set;
        //		},
        //
        //		/**@
        //		* #Crafty.DrawManager.add
        //		* @comp Crafty.DrawManager
        //		* @sign public Crafty.DrawManager.add(old, current)
        //		* @param old - Undocumented
        //		* @param current - Undocumented
        //		* 
        //		* Calculate the bounding rect of dirty data and add to the register of dirty rectangles
        //		*/
        //		add: function add(old, current) {
        //			if (!current) {
        //				dom.push(old);
        //				return;
        //			}
        //
        //			var rect,
        //				before = old._mbr || old,
        //				after = current._mbr || current;
        //
        //			if (old === current) {
        //				rect = old.mbr() || old.pos();
        //			} else {
        //				rect = {
        //					_x: ~~Math.min(before._x, after._x),
        //					_y: ~~Math.min(before._y, after._y),
        //					_w: Math.max(before._w, after._w) + Math.max(before._x, after._x),
        //					_h: Math.max(before._h, after._h) + Math.max(before._y, after._y)
        //				};
        //
        //				rect._w = (rect._w - rect._x);
        //				rect._h = (rect._h - rect._y);
        //			}
        //
        //			if (rect._w === 0 || rect._h === 0 || !this.onScreen(rect)) {
        //				return false;
        //			}
        //
        //			//floor/ceil
        //			rect._x = ~~rect._x;
        //			rect._y = ~~rect._y;
        //			rect._w = (rect._w === ~~rect._w) ? rect._w : rect._w + 1 | 0;
        //			rect._h = (rect._h === ~~rect._h) ? rect._h : rect._h + 1 | 0;
        //
        //			//add to dirty_rects, check for merging
        //			dirty_rects.push(rect);
        //
        //			//if it got merged
        //			return true;
        //		},
        //
        //		/**@
        //		* #Crafty.DrawManager.debug
        //		* @comp Crafty.DrawManager
        //		* @sign public Crafty.DrawManager.debug()
        //		*/
        //		debug: function () {
        //			console.log(dirty_rects, dom);
        //		},
        //
        //		/**@
        //		* #Crafty.DrawManager.draw
        //		* @comp Crafty.DrawManager
        //		* @sign public Crafty.DrawManager.draw([Object rect])
        //        * @param rect - a rectangular region {_x: x_val, _y: y_val, _w: w_val, _h: h_val}
        //        * ~~~
        //		* - If rect is omitted, redraw within the viewport
        //		* - If rect is provided, redraw within the rect
        //		* ~~~
        //		*/
        //		drawAll: function (rect) {
        //			var rect = rect || Crafty.viewport.rect(),
        //				q = Crafty.map.search(rect),
        //				i = 0,
        //				l = q.length,
        //				ctx = Crafty.canvas.context,
        //				current;
        //
        //			ctx.clearRect(rect._x, rect._y, rect._w, rect._h);
        //
        //			//sort the objects by the global Z
        //			q.sort(function (a, b) { return a._globalZ - b._globalZ; });
        //			for (; i < l; i++) {
        //				current = q[i];
        //				if (current._visible && current.__c.Canvas) {
        //					current.draw();
        //					current._changed = false;
        //				}
        //			}
        //		},
        //
        //		/**@
        //		* #Crafty.DrawManager.boundingRect
        //		* @comp Crafty.DrawManager
        //		* @sign public Crafty.DrawManager.boundingRect(set)
        //		* @param set - Undocumented
        //		* ~~~
        //		* - Calculate the common bounding rect of multiple canvas entities.
        //		* - Returns coords
        //		* ~~~
        //		*/
        //		boundingRect: function (set) {
        //			if (!set || !set.length) return;
        //			var newset = [], i = 1,
        //			l = set.length, current, master = set[0], tmp;
        //			master = [master._x, master._y, master._x + master._w, master._y + master._h];
        //			while (i < l) {
        //				current = set[i];
        //				tmp = [current._x, current._y, current._x + current._w, current._y + current._h];
        //				if (tmp[0] < master[0]) master[0] = tmp[0];
        //				if (tmp[1] < master[1]) master[1] = tmp[1];
        //				if (tmp[2] > master[2]) master[2] = tmp[2];
        //				if (tmp[3] > master[3]) master[3] = tmp[3];
        //				i++;
        //			}
        //			tmp = master;
        //			master = { _x: tmp[0], _y: tmp[1], _w: tmp[2] - tmp[0], _h: tmp[3] - tmp[1] };
        //
        //			return master;
        //		},
        //
        //		/**@
        //		* #Crafty.DrawManager.draw
        //		* @comp Crafty.DrawManager
        //		* @sign public Crafty.DrawManager.draw()
        //		* ~~~
        //		* - If the number of rects is over 60% of the total number of objects
        //		*	do the naive method redrawing `Crafty.DrawManager.drawAll`
        //		* - Otherwise, clear the dirty regions, and redraw entities overlapping the dirty regions.
        //		* ~~~
        //		* 
        //        * @see Canvas.draw, DOM.draw
        //		*/
        //		draw: function draw() {
        //			//if nothing in dirty_rects, stop
        //			if (!dirty_rects.length && !dom.length) return;
        //
        //			var i = 0, l = dirty_rects.length, k = dom.length, rect, q,
        //				j, len, dupes, obj, ent, objs = [], ctx = Crafty.canvas.context;
        //
        //			//loop over all DOM elements needing updating
        //			for (; i < k; ++i) {
        //				dom[i].draw()._changed = false;
        //			}
        //			//reset DOM array
        //            dom.length = 0;
        //			//again, stop if nothing in dirty_rects
        //			if (!l) { return; }
        //
        //			//if the amount of rects is over 60% of the total objects
        //			//do the naive method redrawing
        //			if (l / this.total2D > 0.6) {
        //				this.drawAll();
        //				dirty_rects.length = 0;
        //				return;
        //			}
        //
        //			dirty_rects = this.merge(dirty_rects);
        //			for (i = 0; i < l; ++i) { //loop over every dirty rect
        //				rect = dirty_rects[i];
        //				if (!rect) continue;
        //				q = Crafty.map.search(rect, false); //search for ents under dirty rect
        //
        //				dupes = {};
        //
        //				//loop over found objects removing dupes and adding to obj array
        //				for (j = 0, len = q.length; j < len; ++j) {
        //					obj = q[j];
        //
        //					if (dupes[obj[0]] || !obj._visible || !obj.__c.Canvas)
        //						continue;
        //					dupes[obj[0]] = true;
        //
        //					objs.push({ obj: obj, rect: rect });
        //				}
        //
        //				//clear the rect from the main canvas
        //				ctx.clearRect(rect._x, rect._y, rect._w, rect._h);
        //
        //			}
        //
        //			//sort the objects by the global Z
        //			objs.sort(function (a, b) { return a.obj._globalZ - b.obj._globalZ; });
        //			if (!objs.length){ return; }
        //
        //			//loop over the objects
        //			for (i = 0, l = objs.length; i < l; ++i) {
        //				obj = objs[i];
        //				rect = obj.rect;
        //				ent = obj.obj;
        //
        //				var area = ent._mbr || ent,
        //					x = (rect._x - area._x <= 0) ? 0 : ~~(rect._x - area._x),
        //					y = (rect._y - area._y < 0) ? 0 : ~~(rect._y - area._y),
        //					w = ~~Math.min(area._w - x, rect._w - (area._x - rect._x), rect._w, area._w),
        //					h = ~~Math.min(area._h - y, rect._h - (area._y - rect._y), rect._h, area._h);
        //
        //				//no point drawing with no width or height
        //				if (h === 0 || w === 0) continue;
        //
        //				ctx.save();
        //				ctx.beginPath();
        //				ctx.moveTo(rect._x, rect._y);
        //				ctx.lineTo(rect._x + rect._w, rect._y);
        //				ctx.lineTo(rect._x + rect._w, rect._h + rect._y);
        //				ctx.lineTo(rect._x, rect._h + rect._y);
        //				ctx.lineTo(rect._x, rect._y);
        //
        //				ctx.clip();
        //
        //				ent.draw();
        //				ctx.closePath();
        //				ctx.restore();
        //
        //				//allow entity to re-dirty_rects
        //				ent._changed = false;
        //			}
        //
        //			//empty dirty_rects
        //			dirty_rects.length = 0;
        //			//all merged IDs are now invalid
        //			merged = {};
        //		}
        //	};
        //})();
        /**@
        * #Crafty.math
        * @category 2D
        * Static functions.
        */
        Crafty.math = {
            /**@
                 * #Crafty.math.abs
                 * @comp Crafty.math
                 * @sign public this Crafty.math.abs(Number n)
                 * @param n - Some value.
                 * @return Absolute value.
                 * 
                 * Returns the absolute value.
                 */
            abs: function (x) {
                return x < 0 ? -x : x;
            },

            /**@
             * #Crafty.math.amountOf
             * @comp Crafty.math
             * @sign public Number Crafty.math.amountOf(Number checkValue, Number minValue, Number maxValue)
             * @param checkValue - Value that should checked with minimum and maximum.
             * @param minValue - Minimum value to check.
             * @param maxValue - Maximum value to check.
             * @return Amount of checkValue compared to minValue and maxValue.
             * 
             * Returns the amount of how much a checkValue is more like minValue (=0)
             * or more like maxValue (=1)
             */
            amountOf: function (checkValue, minValue, maxValue) {
                if (minValue < maxValue)
                    return (checkValue - minValue) / (maxValue - minValue);
                else
                    return (checkValue - maxValue) / (minValue - maxValue);
            },


            /**@
             * #Crafty.math.clamp
             * @comp Crafty.math
             * @sign public Number Crafty.math.clamp(Number value, Number min, Number max)
             * @param value - A value.
             * @param max - Maximum that value can be.
             * @param min - Minimum that value can be.
             * @return The value between minimum and maximum.
             * 
             * Restricts a value to be within a specified range.
             */
            clamp: function (value, min, max) {
                if (value > max)
                    return max;
                else if (value < min)
                    return min;
                else
                    return value;
            },

            /**@
             * Converts angle from degree to radian.
             * @comp Crafty.math
             * @param angleInDeg - The angle in degree.
             * @return The angle in radian.
             */
            degToRad: function (angleInDeg) {
                return angleInDeg * Math.PI / 180;
            },

            /**@
             * #Crafty.math.distance
             * @comp Crafty.math
             * @sign public Number Crafty.math.distance(Number x1, Number y1, Number x2, Number y2)
             * @param x1 - First x coordinate.
             * @param y1 - First y coordinate.
             * @param x2 - Second x coordinate.
             * @param y2 - Second y coordinate.
             * @return The distance between the two points.
             * 
             * Distance between two points.
             */
            distance: function (x1, y1, x2, y2) {
                var squaredDistance = Crafty.math.squaredDistance(x1, y1, x2, y2);
                return Math.sqrt(parseFloat(squaredDistance));
            },

            /**@
             * #Crafty.math.lerp
             * @comp Crafty.math
             * @sign public Number Crafty.math.lerp(Number value1, Number value2, Number amount)
             * @param value1 - One value.
             * @param value2 - Another value.
             * @param amount - Amount of value2 to value1.
             * @return Linear interpolated value.
             * 
             * Linear interpolation. Passing amount with a value of 0 will cause value1 to be returned,
             * a value of 1 will cause value2 to be returned.
             */
            lerp: function (value1, value2, amount) {
                return value1 + (value2 - value1) * amount;
            },

            /**@
             * #Crafty.math.negate
             * @comp Crafty.math
             * @sign public Number Crafty.math.negate(Number percent)
             * @param percent - If you pass 1 a -1 will be returned. If you pass 0 a 1 will be returned.
             * @return 1 or -1.
             * 
             * Returnes "randomly" -1.
             */
            negate: function (percent) {
                if (Math.random() < percent)
                    return -1;
                else
                    return 1;
            },

            /**@
             * #Crafty.math.radToDeg
             * @comp Crafty.math
             * @sign public Number Crafty.math.radToDeg(Number angle)
             * @param angleInRad - The angle in radian.
             * @return The angle in degree.
             * 
             * Converts angle from radian to degree.
             */
            radToDeg: function (angleInRad) {
                return angleInRad * 180 / Math.PI;
            },

            /**@
             * #Crafty.math.randomElementOfArray
             * @comp Crafty.math
             * @sign public Object Crafty.math.randomElementOfArray(Array array)
             * @param array - A specific array.
             * @return A random element of a specific array.
             * 
             * Returns a random element of a specific array.
             */
            randomElementOfArray: function (array) {
                return array[Math.floor(array.length * Math.random())];
            },

            /**@
             * #Crafty.math.randomInt
             * @comp Crafty.math
             * @sign public Number Crafty.math.randomInt(Number start, Number end)
             * @param start - Smallest int value that can be returned.
             * @param end - Biggest int value that can be returned.
             * @return A random int.
             * 
             * Returns a random int in within a specific range.
             */
            randomInt: function (start, end) {
                return start + Math.floor((1 + end - start) * Math.random());
            },

            /**@
             * #Crafty.math.randomNumber
             * @comp Crafty.math
             * @sign public Number Crafty.math.randomInt(Number start, Number end)
             * @param start - Smallest number value that can be returned.
             * @param end - Biggest number value that can be returned.
             * @return A random number.
             * 
             * Returns a random number in within a specific range.
             */
            randomNumber: function (start, end) {
                return start + (end - start) * Math.random();
            },

            /**@
             * #Crafty.math.squaredDistance
             * @comp Crafty.math
             * @sign public Number Crafty.math.squaredDistance(Number x1, Number y1, Number x2, Number y2)
             * @param x1 - First x coordinate.
             * @param y1 - First y coordinate.
             * @param x2 - Second x coordinate.
             * @param y2 - Second y coordinate.
             * @return The squared distance between the two points.
             * 
             * Squared distance between two points.
             */
            squaredDistance: function (x1, y1, x2, y2) {
                return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
            },

            /**@
             * #Crafty.math.withinRange
             * @comp Crafty.math
             * @sign public Boolean Crafty.math.withinRange(Number value, Number min, Number max)
             * @param value - The specific value.
             * @param min - Minimum value.
             * @param max - Maximum value.
             * @return Returns true if value is within a specific range.
             * 
             * Check if a value is within a specific range.
             */
            withinRange: function (value, min, max) {
                return (value >= min && value <= max);
            }
        };

        Crafty.math.Vector2D = (function () {
            /**@
             * #Crafty.math.Vector2D
             * @category 2D
             * @class This is a general purpose 2D vector class
             *
             * Vector2D uses the following form:
             * <x, y>
             *
             * @public
             * @sign public {Vector2D} Vector2D();
             * @sign public {Vector2D} Vector2D(Vector2D);
             * @sign public {Vector2D} Vector2D(Number, Number);
             * @param {Vector2D|Number=0} x
             * @param {Number=0} y
             */
            function Vector2D(x, y) {
                if (x instanceof Vector2D) {
                    this.x = x.x;
                    this.y = x.y;
                } else if (arguments.length === 2) {
                    this.x = x;
                    this.y = y;
                } else if (arguments.length > 0)
                    throw "Unexpected number of arguments for Vector2D()";
            } // class Vector2D

            Vector2D.prototype.x = 0;
            Vector2D.prototype.y = 0;

            /**@
             * #.add
             * @comp Crafty.math.Vector2D
             *
             * Adds the passed vector to this vector
             *
             * @public
             * @sign public {Vector2D} add(Vector2D);
             * @param {vector2D} vecRH
             * @returns {Vector2D} this after adding
             */
            Vector2D.prototype.add = function (vecRH) {
                this.x += vecRH.x;
                this.y += vecRH.y;
                return this;
            }; // add

            /**@
             * #.angleBetween
             * @comp Crafty.math.Vector2D
             *
             * Calculates the angle between the passed vector and this vector, using <0,0> as the point of reference.
             * Angles returned have the range (−π, π].
             *
             * @public
             * @sign public {Number} angleBetween(Vector2D);
             * @param {Vector2D} vecRH
             * @returns {Number} the angle between the two vectors in radians
             */
            Vector2D.prototype.angleBetween = function (vecRH) {
                return Math.atan2(this.x * vecRH.y - this.y * vecRH.x, this.x * vecRH.x + this.y * vecRH.y);
            }; // angleBetween

            /**@
             * #.angleTo
             * @comp Crafty.math.Vector2D
             *
             * Calculates the angle to the passed vector from this vector, using this vector as the point of reference.
             *
             * @public
             * @sign public {Number} angleTo(Vector2D);
             * @param {Vector2D} vecRH
             * @returns {Number} the angle to the passed vector in radians
             */
            Vector2D.prototype.angleTo = function (vecRH) {
                return Math.atan2(vecRH.y - this.y, vecRH.x - this.x);
            };

            /**@
             * #.clone
             * @comp Crafty.math.Vector2D
             *
             * Creates and exact, numeric copy of this vector
             *
             * @public
             * @sign public {Vector2D} clone();
             * @returns {Vector2D} the new vector
             */
            Vector2D.prototype.clone = function () {
                return new Vector2D(this);
            }; // clone

            /**@
             * #.distance
             * @comp Crafty.math.Vector2D
             *
             * Calculates the distance from this vector to the passed vector.
             *
             * @public
             * @sign public {Number} distance(Vector2D);
             * @param {Vector2D} vecRH
             * @returns {Number} the distance between the two vectors
             */
            Vector2D.prototype.distance = function (vecRH) {
                return Math.sqrt((vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y));
            }; // distance

            /**@
             * #.distanceSq
             * @comp Crafty.math.Vector2D
             *
             * Calculates the squared distance from this vector to the passed vector.
             * This function avoids calculating the square root, thus being slightly faster than .distance( ).
             *
             * @public
             * @sign public {Number} distanceSq(Vector2D);
             * @param {Vector2D} vecRH
             * @returns {Number} the squared distance between the two vectors
             * @see .distance
             */
            Vector2D.prototype.distanceSq = function (vecRH) {
                return (vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y);
            }; // distanceSq

            /**@
             * #.divide
             * @comp Crafty.math.Vector2D
             *
             * Divides this vector by the passed vector.
             *
             * @public
             * @sign public {Vector2D} divide(Vector2D);
             * @param {Vector2D} vecRH
             * @returns {Vector2D} this vector after dividing
             */
            Vector2D.prototype.divide = function (vecRH) {
                this.x /= vecRH.x;
                this.y /= vecRH.y;
                return this;
            }; // divide

            /**@
             * #.dotProduct
             * @comp Crafty.math.Vector2D
             *
             * Calculates the dot product of this and the passed vectors
             *
             * @public
             * @sign public {Number} dotProduct(Vector2D);
             * @param {Vector2D} vecRH
             * @returns {Number} the resultant dot product
             */
            Vector2D.prototype.dotProduct = function (vecRH) {
                return this.x * vecRH.x + this.y * vecRH.y;
            }; // dotProduct

            /**@
             * #.equals
             * @comp Crafty.math.Vector2D
             *
             * Determines if this vector is numerically equivalent to the passed vector.
             *
             * @public
             * @sign public {Boolean} equals(Vector2D);
             * @param {Vector2D} vecRH
             * @returns {Boolean} true if the vectors are equivalent
             */
            Vector2D.prototype.equals = function (vecRH) {
                return vecRH instanceof Vector2D &&
                    this.x == vecRH.x && this.y == vecRH.y;
            }; // equals

            /**@
             * #.getNormal
             * @comp Crafty.math.Vector2D
             *
             * Calculates a new right-handed normal vector for the line created by this and the passed vectors.
             *
             * @public
             * @sign public {Vector2D} getNormal([Vector2D]);
             * @param {Vector2D=<0,0>} [vecRH]
             * @returns {Vector2D} the new normal vector
             */
            Vector2D.prototype.getNormal = function (vecRH) {
                if (vecRH === undefined)
                    return new Vector2D(-this.y, this.x); // assume vecRH is <0, 0>
                return new Vector2D(vecRH.y - this.y, this.x - vecRH.x).normalize();
            }; // getNormal

            /**@
             * #.isZero
             * @comp Crafty.math.Vector2D
             *
             * Determines if this vector is equal to <0,0>
             *
             * @public
             * @sign public {Boolean} isZero();
             * @returns {Boolean} true if this vector is equal to <0,0>
             */
            Vector2D.prototype.isZero = function () {
                return this.x === 0 && this.y === 0;
            }; // isZero

            /**@
             * #.magnitude
             * @comp Crafty.math.Vector2D
             *
             * Calculates the magnitude of this vector.
             * Note: Function objects in JavaScript already have a 'length' member, hence the use of magnitude instead.
             *
             * @public
             * @sign public {Number} magnitude();
             * @returns {Number} the magnitude of this vector
             */
            Vector2D.prototype.magnitude = function () {
                return Math.sqrt(this.x * this.x + this.y * this.y);
            }; // magnitude

            /**@
             * #.magnitudeSq
             * @comp Crafty.math.Vector2D
             *
             * Calculates the square of the magnitude of this vector.
             * This function avoids calculating the square root, thus being slightly faster than .magnitude( ).
             *
             * @public
             * @sign public {Number} magnitudeSq();
             * @returns {Number} the square of the magnitude of this vector
             * @see .magnitude
             */
            Vector2D.prototype.magnitudeSq = function () {
                return this.x * this.x + this.y * this.y;
            }; // magnitudeSq

            /**@
             * #.multiply
             * @comp Crafty.math.Vector2D
             *
             * Multiplies this vector by the passed vector
             *
             * @public
             * @sign public {Vector2D} multiply(Vector2D);
             * @param {Vector2D} vecRH
             * @returns {Vector2D} this vector after multiplying
             */
            Vector2D.prototype.multiply = function (vecRH) {
                this.x *= vecRH.x;
                this.y *= vecRH.y;
                return this;
            }; // multiply

            /**@
             * #.negate
             * @comp Crafty.math.Vector2D
             *
             * Negates this vector (ie. <-x,-y>)
             *
             * @public
             * @sign public {Vector2D} negate();
             * @returns {Vector2D} this vector after negation
             */
            Vector2D.prototype.negate = function () {
                this.x = -this.x;
                this.y = -this.y;
                return this;
            }; // negate

            /**@
             * #.normalize
             * @comp Crafty.math.Vector2D
             *
             * Normalizes this vector (scales the vector so that its new magnitude is 1)
             * For vectors where magnitude is 0, <1,0> is returned.
             *
             * @public
             * @sign public {Vector2D} normalize();
             * @returns {Vector2D} this vector after normalization
             */
            Vector2D.prototype.normalize = function () {
                var lng = Math.sqrt(this.x * this.x + this.y * this.y);

                if (lng === 0) {
                    // default due East
                    this.x = 1;
                    this.y = 0;
                } else {
                    this.x /= lng;
                    this.y /= lng;
                } // else

                return this;
            }; // normalize

            /**@
             * #.scale
             * @comp Crafty.math.Vector2D
             *
             * Scales this vector by the passed amount(s)
             * If scalarY is omitted, scalarX is used for both axes
             *
             * @public
             * @sign public {Vector2D} scale(Number[, Number]);
             * @param {Number} scalarX
             * @param {Number} [scalarY]
             * @returns {Vector2D} this after scaling
             */
            Vector2D.prototype.scale = function (scalarX, scalarY) {
                if (scalarY === undefined)
                    scalarY = scalarX;

                this.x *= scalarX;
                this.y *= scalarY;

                return this;
            }; // scale

            /**@
             * #.scaleToMagnitude
             * @comp Crafty.math.Vector2D
             *
             * Scales this vector such that its new magnitude is equal to the passed value.
             *
             * @public
             * @sign public {Vector2D} scaleToMagnitude(Number);
             * @param {Number} mag
             * @returns {Vector2D} this vector after scaling
             */
            Vector2D.prototype.scaleToMagnitude = function (mag) {
                var k = mag / this.magnitude();
                this.x *= k;
                this.y *= k;
                return this;
            }; // scaleToMagnitude

            /**@
             * #.setValues
             * @comp Crafty.math.Vector2D
             *
             * Sets the values of this vector using a passed vector or pair of numbers.
             *
             * @public
             * @sign public {Vector2D} setValues(Vector2D);
             * @sign public {Vector2D} setValues(Number, Number);
             * @param {Number|Vector2D} x
             * @param {Number} y
             * @returns {Vector2D} this vector after setting of values
             */
            Vector2D.prototype.setValues = function (x, y) {
                if (x instanceof Vector2D) {
                    this.x = x.x;
                    this.y = x.y;
                } else {
                    this.x = x;
                    this.y = y;
                } // else

                return this;
            }; // setValues

            /**@
             * #.subtract
             * @comp Crafty.math.Vector2D
             *
             * Subtracts the passed vector from this vector.
             *
             * @public
             * @sign public {Vector2D} subtract(Vector2D);
             * @param {Vector2D} vecRH
             * @returns {vector2D} this vector after subtracting
             */
            Vector2D.prototype.subtract = function (vecRH) {
                this.x -= vecRH.x;
                this.y -= vecRH.y;
                return this;
            }; // subtract

            /**@
             * #.toString
             * @comp Crafty.math.Vector2D
             *
             * Returns a string representation of this vector.
             *
             * @public
             * @sign public {String} toString();
             * @returns {String}
             */
            Vector2D.prototype.toString = function () {
                return "Vector2D(" + this.x + ", " + this.y + ")";
            }; // toString

            /**@
             * #.translate
             * @comp Crafty.math.Vector2D
             *
             * Translates (moves) this vector by the passed amounts.
             * If dy is omitted, dx is used for both axes.
             *
             * @public
             * @sign public {Vector2D} translate(Number[, Number]);
             * @param {Number} dx
             * @param {Number} [dy]
             * @returns {Vector2D} this vector after translating
             */
            Vector2D.prototype.translate = function (dx, dy) {
                if (dy === undefined)
                    dy = dx;

                this.x += dx;
                this.y += dy;

                return this;
            }; // translate

            /**@
             * #.tripleProduct
             * @comp Crafty.math.Vector2D
             *
             * Calculates the triple product of three vectors.
             * triple vector product = b(a•c) - a(b•c)
             *
             * @public
             * @static
             * @sign public {Vector2D} tripleProduct(Vector2D, Vector2D, Vector2D);
             * @param {Vector2D} a
             * @param {Vector2D} b
             * @param {Vector2D} c
             * @return {Vector2D} the triple product as a new vector
             */
            Vector2D.tripleProduct = function (a, b, c) {
                var ac = a.dotProduct(c);
                var bc = b.dotProduct(c);
                return new Crafty.math.Vector2D(b.x * ac - a.x * bc, b.y * ac - a.y * bc);
            };

            return Vector2D;
        })();

        Crafty.math.Matrix2D = (function () {
            /**@
             * #Crafty.math.Matrix2D
             * @category 2D
             *
             * @class This is a 2D Matrix2D class. It is 3x3 to allow for affine transformations in 2D space.
             * The third row is always assumed to be [0, 0, 1].
             *
             * Matrix2D uses the following form, as per the whatwg.org specifications for canvas.transform():
             * [a, c, e]
             * [b, d, f]
             * [0, 0, 1]
             *
             * @public
             * @sign public {Matrix2D} new Matrix2D();
             * @sign public {Matrix2D} new Matrix2D(Matrix2D);
             * @sign public {Matrix2D} new Matrix2D(Number, Number, Number, Number, Number, Number);
             * @param {Matrix2D|Number=1} a
             * @param {Number=0} b
             * @param {Number=0} c
             * @param {Number=1} d
             * @param {Number=0} e
             * @param {Number=0} f
             */
            var Matrix2D = function (a, b, c, d, e, f) {
                if (a instanceof Matrix2D) {
                    this.a = a.a;
                    this.b = a.b;
                    this.c = a.c;
                    this.d = a.d;
                    this.e = a.e;
                    this.f = a.f;
                } else if (arguments.length === 6) {
                    this.a = a;
                    this.b = b;
                    this.c = c;
                    this.d = d;
                    this.e = e;
                    this.f = f;
                } else if (arguments.length > 0)
                    throw "Unexpected number of arguments for Matrix2D()";
            }; // class Matrix2D

            Matrix2D.prototype.a = 1;
            Matrix2D.prototype.b = 0;
            Matrix2D.prototype.c = 0;
            Matrix2D.prototype.d = 1;
            Matrix2D.prototype.e = 0;
            Matrix2D.prototype.f = 0;

            /**@
             * #.apply
             * @comp Crafty.math.Matrix2D
             *
             * Applies the matrix transformations to the passed object
             *
             * @public
             * @sign public {Vector2D} apply(Vector2D);
             * @param {Vector2D} vecRH - vector to be transformed
             * @returns {Vector2D} the passed vector object after transforming
             */
            Matrix2D.prototype.apply = function (vecRH) {
                // I'm not sure of the best way for this function to be implemented. Ideally
                // support for other objects (rectangles, polygons, etc) should be easily
                // addable in the future. Maybe a function (apply) is not the best way to do
                // this...?

                var tmpX = vecRH.x;
                vecRH.x = tmpX * this.a + vecRH.y * this.c + this.e;
                vecRH.y = tmpX * this.b + vecRH.y * this.d + this.f;
                // no need to homogenize since the third row is always [0, 0, 1]

                return vecRH;
            }; // apply

            /**@
             * #.clone
             * @comp Crafty.math.Matrix2D
             *
             * Creates an exact, numeric copy of the current matrix
             *
             * @public
             * @sign public {Matrix2D} clone();
             * @returns {Matrix2D}
             */
            Matrix2D.prototype.clone = function () {
                return new Matrix2D(this);
            }; // clone

            /**@
             * #.combine
             * @comp Crafty.math.Matrix2D
             *
             * Multiplies this matrix with another, overriding the values of this matrix.
             * The passed matrix is assumed to be on the right-hand side.
             *
             * @public
             * @sign public {Matrix2D} combine(Matrix2D);
             * @param {Matrix2D} mtrxRH
             * @returns {Matrix2D} this matrix after combination
             */
            Matrix2D.prototype.combine = function (mtrxRH) {
                var tmp = this.a;
                this.a = tmp * mtrxRH.a + this.b * mtrxRH.c;
                this.b = tmp * mtrxRH.b + this.b * mtrxRH.d;
                tmp = this.c;
                this.c = tmp * mtrxRH.a + this.d * mtrxRH.c;
                this.d = tmp * mtrxRH.b + this.d * mtrxRH.d;
                tmp = this.e;
                this.e = tmp * mtrxRH.a + this.f * mtrxRH.c + mtrxRH.e;
                this.f = tmp * mtrxRH.b + this.f * mtrxRH.d + mtrxRH.f;
                return this;
            }; // combine

            /**@
             * #.equals
             * @comp Crafty.math.Matrix2D
             *
             * Checks for the numeric equality of this matrix versus another.
             *
             * @public
             * @sign public {Boolean} equals(Matrix2D);
             * @param {Matrix2D} mtrxRH
             * @returns {Boolean} true if the two matrices are numerically equal
             */
            Matrix2D.prototype.equals = function (mtrxRH) {
                return mtrxRH instanceof Matrix2D &&
                    this.a == mtrxRH.a && this.b == mtrxRH.b && this.c == mtrxRH.c &&
                    this.d == mtrxRH.d && this.e == mtrxRH.e && this.f == mtrxRH.f;
            }; // equals

            /**@
             * #.determinant
             * @comp Crafty.math.Matrix2D
             *
             * Calculates the determinant of this matrix
             *
             * @public
             * @sign public {Number} determinant();
             * @returns {Number} det(this matrix)
             */
            Matrix2D.prototype.determinant = function () {
                return this.a * this.d - this.b * this.c;
            }; // determinant

            /**@
             * #.invert
             * @comp Crafty.math.Matrix2D
             *
             * Inverts this matrix if possible
             *
             * @public
             * @sign public {Matrix2D} invert();
             * @returns {Matrix2D} this inverted matrix or the original matrix on failure
             * @see .isInvertible
             */
            Matrix2D.prototype.invert = function () {
                var det = this.determinant();

                // matrix is invertible if its determinant is non-zero
                if (det !== 0) {
                    var old = {
                        a: this.a,
                        b: this.b,
                        c: this.c,
                        d: this.d,
                        e: this.e,
                        f: this.f
                    };
                    this.a = old.d / det;
                    this.b = -old.b / det;
                    this.c = -old.c / det;
                    this.d = old.a / det;
                    this.e = (old.c * old.f - old.e * old.d) / det;
                    this.f = (old.e * old.b - old.a * old.f) / det;
                } // if

                return this;
            }; // invert

            /**@
             * #.isIdentity
             * @comp Crafty.math.Matrix2D
             *
             * Returns true if this matrix is the identity matrix
             *
             * @public
             * @sign public {Boolean} isIdentity();
             * @returns {Boolean}
             */
            Matrix2D.prototype.isIdentity = function () {
                return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
            }; // isIdentity

            /**@
             * #.isInvertible
             * @comp Crafty.math.Matrix2D
             *
             * Determines is this matrix is invertible.
             *
             * @public
             * @sign public {Boolean} isInvertible();
             * @returns {Boolean} true if this matrix is invertible
             * @see .invert
             */
            Matrix2D.prototype.isInvertible = function () {
                return this.determinant() !== 0;
            }; // isInvertible

            /**@
             * #.preRotate
             * @comp Crafty.math.Matrix2D
             *
             * Applies a counter-clockwise pre-rotation to this matrix
             *
             * @public
             * @sign public {Matrix2D} preRotate(Number);
             * @param {number} rads - angle to rotate in radians
             * @returns {Matrix2D} this matrix after pre-rotation
             */
            Matrix2D.prototype.preRotate = function (rads) {
                var nCos = Math.cos(rads);
                var nSin = Math.sin(rads);

                var tmp = this.a;
                this.a = nCos * tmp - nSin * this.b;
                this.b = nSin * tmp + nCos * this.b;
                tmp = this.c;
                this.c = nCos * tmp - nSin * this.d;
                this.d = nSin * tmp + nCos * this.d;

                return this;
            }; // preRotate

            /**@
             * #.preScale
             * @comp Crafty.math.Matrix2D
             *
             * Applies a pre-scaling to this matrix
             *
             * @public
             * @sign public {Matrix2D} preScale(Number[, Number]);
             * @param {Number} scalarX
             * @param {Number} [scalarY] scalarX is used if scalarY is undefined
             * @returns {Matrix2D} this after pre-scaling
             */
            Matrix2D.prototype.preScale = function (scalarX, scalarY) {
                if (scalarY === undefined)
                    scalarY = scalarX;

                this.a *= scalarX;
                this.b *= scalarY;
                this.c *= scalarX;
                this.d *= scalarY;

                return this;
            }; // preScale

            /**@
             * #.preTranslate
             * @comp Crafty.math.Matrix2D
             *
             * Applies a pre-translation to this matrix
             *
             * @public
             * @sign public {Matrix2D} preTranslate(Vector2D);
             * @sign public {Matrix2D} preTranslate(Number, Number);
             * @param {Number|Vector2D} dx
             * @param {Number} dy
             * @returns {Matrix2D} this matrix after pre-translation
             */
            Matrix2D.prototype.preTranslate = function (dx, dy) {
                if (typeof dx === "number") {
                    this.e += dx;
                    this.f += dy;
                } else {
                    this.e += dx.x;
                    this.f += dx.y;
                } // else

                return this;
            }; // preTranslate

            /**@
             * #.rotate
             * @comp Crafty.math.Matrix2D
             *
             * Applies a counter-clockwise post-rotation to this matrix
             *
             * @public
             * @sign public {Matrix2D} rotate(Number);
             * @param {Number} rads - angle to rotate in radians
             * @returns {Matrix2D} this matrix after rotation
             */
            Matrix2D.prototype.rotate = function (rads) {
                var nCos = Math.cos(rads);
                var nSin = Math.sin(rads);

                var tmp = this.a;
                this.a = nCos * tmp - nSin * this.b;
                this.b = nSin * tmp + nCos * this.b;
                tmp = this.c;
                this.c = nCos * tmp - nSin * this.d;
                this.d = nSin * tmp + nCos * this.d;
                tmp = this.e;
                this.e = nCos * tmp - nSin * this.f;
                this.f = nSin * tmp + nCos * this.f;

                return this;
            }; // rotate

            /**@
             * #.scale
             * @comp Crafty.math.Matrix2D
             *
             * Applies a post-scaling to this matrix
             *
             * @public
             * @sign public {Matrix2D} scale(Number[, Number]);
             * @param {Number} scalarX
             * @param {Number} [scalarY] scalarX is used if scalarY is undefined
             * @returns {Matrix2D} this after post-scaling
             */
            Matrix2D.prototype.scale = function (scalarX, scalarY) {
                if (scalarY === undefined)
                    scalarY = scalarX;

                this.a *= scalarX;
                this.b *= scalarY;
                this.c *= scalarX;
                this.d *= scalarY;
                this.e *= scalarX;
                this.f *= scalarY;

                return this;
            }; // scale

            /**@
             * #.setValues
             * @comp Crafty.math.Matrix2D
             *
             * Sets the values of this matrix
             *
             * @public
             * @sign public {Matrix2D} setValues(Matrix2D);
             * @sign public {Matrix2D} setValues(Number, Number, Number, Number, Number, Number);
             * @param {Matrix2D|Number} a
             * @param {Number} b
             * @param {Number} c
             * @param {Number} d
             * @param {Number} e
             * @param {Number} f
             * @returns {Matrix2D} this matrix containing the new values
             */
            Matrix2D.prototype.setValues = function (a, b, c, d, e, f) {
                if (a instanceof Matrix2D) {
                    this.a = a.a;
                    this.b = a.b;
                    this.c = a.c;
                    this.d = a.d;
                    this.e = a.e;
                    this.f = a.f;
                } else {
                    this.a = a;
                    this.b = b;
                    this.c = c;
                    this.d = d;
                    this.e = e;
                    this.f = f;
                } // else

                return this;
            }; // setValues

            /**@
             * #.toString
             * @comp Crafty.math.Matrix2D
             *
             * Returns the string representation of this matrix.
             *
             * @public
             * @sign public {String} toString();
             * @returns {String}
             */
            Matrix2D.prototype.toString = function () {
                return "Matrix2D([" + this.a + ", " + this.c + ", " + this.e +
                    "] [" + this.b + ", " + this.d + ", " + this.f + "] [0, 0, 1])";
            }; // toString

            /**@
             * #.translate
             * @comp Crafty.math.Matrix2D
             *
             * Applies a post-translation to this matrix
             *
             * @public
             * @sign public {Matrix2D} translate(Vector2D);
             * @sign public {Matrix2D} translate(Number, Number);
             * @param {Number|Vector2D} dx
             * @param {Number} dy
             * @returns {Matrix2D} this matrix after post-translation
             */
            Matrix2D.prototype.translate = function (dx, dy) {
                if (typeof dx === "number") {
                    this.e += this.a * dx + this.c * dy;
                    this.f += this.b * dx + this.d * dy;
                } else {
                    this.e += this.a * dx.x + this.c * dx.y;
                    this.f += this.b * dx.x + this.d * dx.y;
                } // else

                return this;
            }; // translate

            return Matrix2D;
        })();
        /**@
        * #Crafty Time
        * @category Utilities
        */
        Crafty.c("Delay", {
            init: function () {
                this._delays = [];
                this.bind("EnterFrame", function () {
                    var now = new Date().getTime();
                    for (var index in this._delays) {
                        var item = this._delays[index];
                        if (!item.triggered && item.start + item.delay + item.pause < now) {
                            item.triggered = true;
                            item.func.call(this);
                        }
                    }
                });
                this.bind("Pause", function () {
                    var now = new Date().getTime();
                    for (var index in this._delays) {
                        this._delays[index].pauseBuffer = now;
                    }
                });
                this.bind("Unpause", function () {
                    var now = new Date().getTime();
                    for (var index in this._delays) {
                        var item = this._delays[index];
                        item.pause += now - item.pauseBuffer;
                    }
                });
            },
            /**@
            * #.delay
            * @comp Crafty Time
            * @sign public this.delay(Function callback, Number delay)
            * @param callback - Method to execute after given amount of milliseconds
            * @param delay - Amount of milliseconds to execute the method
            * 
            * The delay method will execute a function after a given amount of time in milliseconds.
            * 
            * It is not a wrapper for `setTimeout`.
            * 
            * If Crafty is paused, the delay is interrupted with the pause and then resume when unpaused
            *
            * If the entity is destroyed, the delay is also destroyed and will not have effect. 
            *
            * @example
            * ~~~
            * console.log("start");
            * this.delay(function() {
                console.log("100ms later");
            * }, 100);
            * ~~~
            */
            delay: function (func, delay) {
                return this._delays.push({
                    start: new Date().getTime(),
                    func: func,
                    delay: delay,
                    triggered: false,
                    pauseBuffer: 0,
                    pause: 0
                });
            }
        });
    };

    exports = module.exports = Components;
})();