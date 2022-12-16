(function (d, c, b, e) {
  function a(g, f) {
    this.settings = null;
    this.options = d.extend({}, a.Defaults, f);
    this.$element = d(g);
    this._handlers = {};
    this._plugins = {};
    this._supress = {};
    this._current = null;
    this._speed = null;
    this._coordinates = [];
    this._breakpoint = null;
    this._width = null;
    this._items = [];
    this._clones = [];
    this._mergers = [];
    this._widths = [];
    this._invalidated = {};
    this._pipe = [];
    this._drag = {
      time: null,
      target: null,
      pointer: null,
      stage: { start: null, current: null },
      direction: null,
    };
    this._states = {
      current: {},
      tags: {
        initializing: ["busy"],
        animating: ["busy"],
        dragging: ["interacting"],
      },
    };
    d.each(
      ["onResize", "onThrottledResize"],
      d.proxy(function (h, j) {
        this._handlers[j] = d.proxy(this[j], this);
      }, this)
    );
    d.each(
      a.Plugins,
      d.proxy(function (h, i) {
        this._plugins[h.charAt(0).toLowerCase() + h.slice(1)] = new i(this);
      }, this)
    );
    d.each(
      a.Workers,
      d.proxy(function (h, i) {
        this._pipe.push({ filter: i.filter, run: d.proxy(i.run, this) });
      }, this)
    );
    this.setup();
    this.initialize();
  }
  a.Defaults = {
    items: 3,
    loop: false,
    center: false,
    rewind: false,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    freeDrag: false,
    margin: 0,
    stagePadding: 0,
    merge: false,
    mergeFit: true,
    autoWidth: false,
    startPosition: 0,
    rtl: false,
    smartSpeed: 250,
    fluidSpeed: false,
    dragEndSpeed: false,
    responsive: {},
    responsiveRefreshRate: 200,
    responsiveBaseElement: c,
    fallbackEasing: "swing",
    info: false,
    nestedItemSelector: false,
    itemElement: "div",
    stageElement: "div",
    refreshClass: "owl-refresh",
    loadedClass: "owl-loaded",
    loadingClass: "owl-loading",
    rtlClass: "owl-rtl",
    responsiveClass: "owl-responsive",
    dragClass: "owl-drag",
    itemClass: "owl-item",
    stageClass: "owl-stage",
    stageOuterClass: "owl-stage-outer",
    grabClass: "owl-grab",
  };
  a.Width = { Default: "default", Inner: "inner", Outer: "outer" };
  a.Type = { Event: "event", State: "state" };
  a.Plugins = {};
  a.Workers = [
    {
      filter: ["width", "settings"],
      run: function () {
        this._width = this.$element.width();
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (f) {
        f.current = this._items && this._items[this.relative(this._current)];
      },
    },
    {
      filter: ["items", "settings"],
      run: function () {
        this.$stage.children(".cloned").remove();
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (f) {
        var i = this.settings.margin || "",
          h = !this.settings.autoWidth,
          j = this.settings.rtl,
          g = {
            width: "auto",
            "margin-left": j ? i : "",
            "margin-right": j ? "" : i,
          };
        !h && this.$stage.children().css(g);
        f.css = g;
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (f) {
        var i =
            (this.width() / this.settings.items).toFixed(3) -
            this.settings.margin,
          k = null,
          h = this._items.length,
          g = !this.settings.autoWidth,
          j = [];
        f.items = { merge: false, width: i };
        while (h--) {
          k = this._mergers[h];
          k = (this.settings.mergeFit && Math.min(k, this.settings.items)) || k;
          f.items.merge = k > 1 || f.items.merge;
          j[h] = !g ? this._items[h].width() : i * k;
        }
        this._widths = j;
      },
    },
    {
      filter: ["items", "settings"],
      run: function () {
        var m = [],
          i = this._items,
          k = this.settings,
          g = Math.max(k.items * 2, 4),
          j = Math.ceil(i.length / 2) * 2,
          l = k.loop && i.length ? (k.rewind ? g : Math.max(g, j)) : 0,
          f = "",
          h = "";
        l /= 2;
        while (l--) {
          m.push(this.normalize(m.length / 2, true));
          f = f + i[m[m.length - 1]][0].outerHTML;
          m.push(this.normalize(i.length - 1 - (m.length - 1) / 2, true));
          h = i[m[m.length - 1]][0].outerHTML + h;
        }
        this._clones = m;
        d(f).addClass("cloned").appendTo(this.$stage);
        d(h).addClass("cloned").prependTo(this.$stage);
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function () {
        var j = this.settings.rtl ? 1 : -1,
          f = this._clones.length + this._items.length,
          g = -1,
          h = 0,
          i = 0,
          k = [];
        while (++g < f) {
          h = k[g - 1] || 0;
          i = this._widths[this.relative(g)] + this.settings.margin;
          k.push(h + i * j);
        }
        this._coordinates = k;
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function () {
        var g = this.settings.stagePadding,
          h = this._coordinates,
          f = {
            width: Math.ceil(Math.abs(h[h.length - 1])) + g * 2,
            "padding-left": g || "",
            "padding-right": g || "",
          };
        this.$stage.css(f);
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (g) {
        var i = this._coordinates.length,
          h = !this.settings.autoWidth,
          f = this.$stage.children();
        if (h && g.items.merge) {
          while (i--) {
            g.css.width = this._widths[this.relative(i)];
            f.eq(i).css(g.css);
          }
        } else {
          if (h) {
            g.css.width = g.items.width;
            f.css(g.css);
          }
        }
      },
    },
    {
      filter: ["items"],
      run: function () {
        this._coordinates.length < 1 && this.$stage.removeAttr("style");
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (f) {
        f.current = f.current ? this.$stage.children().index(f.current) : 0;
        f.current = Math.max(
          this.minimum(),
          Math.min(this.maximum(), f.current)
        );
        this.reset(f.current);
      },
    },
    {
      filter: ["position"],
      run: function () {
        this.animate(this.coordinates(this._current));
      },
    },
    {
      filter: ["width", "position", "items", "settings"],
      run: function () {
        var l = this.settings.rtl ? 1 : -1,
          m = this.settings.stagePadding * 2,
          g = this.coordinates(this.current()) + m,
          h = g + this.width() * l,
          p,
          o,
          k = [],
          j,
          f;
        for (j = 0, f = this._coordinates.length; j < f; j++) {
          p = this._coordinates[j - 1] || 0;
          o = Math.abs(this._coordinates[j]) + m * l;
          if (
            (this.op(p, "<=", g) && this.op(p, ">", h)) ||
            (this.op(o, "<", g) && this.op(o, ">", h))
          ) {
            k.push(j);
          }
        }
        this.$stage.children(".active").removeClass("active");
        this.$stage
          .children(":eq(" + k.join("), :eq(") + ")")
          .addClass("active");
        if (this.settings.center) {
          this.$stage.children(".center").removeClass("center");
          this.$stage.children().eq(this.current()).addClass("center");
        }
      },
    },
  ];
  a.prototype.initialize = function () {
    this.enter("initializing");
    this.trigger("initialize");
    this.$element.toggleClass(this.settings.rtlClass, this.settings.rtl);
    if (this.settings.autoWidth && !this.is("pre-loading")) {
      var h, g, f;
      h = this.$element.find("img");
      g = this.settings.nestedItemSelector
        ? "." + this.settings.nestedItemSelector
        : e;
      f = this.$element.children(g).width();
      if (h.length && f <= 0) {
        this.preloadAutoWidthImages(h);
      }
    }
    this.$element.addClass(this.options.loadingClass);
    this.$stage = d(
      "<" +
        this.settings.stageElement +
        ' class="' +
        this.settings.stageClass +
        '"/>'
    ).wrap('<div class="' + this.settings.stageOuterClass + '"/>');
    this.$element.append(this.$stage.parent());
    this.replace(this.$element.children().not(this.$stage.parent()));
    if (this.$element.is(":visible")) {
      this.refresh();
    } else {
      this.invalidate("width");
    }
    this.$element
      .removeClass(this.options.loadingClass)
      .addClass(this.options.loadedClass);
    this.registerEventHandlers();
    this.leave("initializing");
    this.trigger("initialized");
  };
  a.prototype.setup = function () {
    var f = this.viewport(),
      h = this.options.responsive,
      g = -1,
      i = null;
    if (!h) {
      i = d.extend({}, this.options);
    } else {
      d.each(h, function (j) {
        if (j <= f && j > g) {
          g = Number(j);
        }
      });
      i = d.extend({}, this.options, h[g]);
      if (typeof i.stagePadding === "function") {
        i.stagePadding = i.stagePadding();
      }
      delete i.responsive;
      if (i.responsiveClass) {
        this.$element.attr(
          "class",
          this.$element
            .attr("class")
            .replace(
              new RegExp("(" + this.options.responsiveClass + "-)\\S+\\s", "g"),
              "$1" + g
            )
        );
      }
    }
    this.trigger("change", { property: { name: "settings", value: i } });
    this._breakpoint = g;
    this.settings = i;
    this.invalidate("settings");
    this.trigger("changed", {
      property: { name: "settings", value: this.settings },
    });
  };
  a.prototype.optionsLogic = function () {
    if (this.settings.autoWidth) {
      this.settings.stagePadding = false;
      this.settings.merge = false;
    }
  };
  a.prototype.prepare = function (g) {
    var f = this.trigger("prepare", { content: g });
    if (!f.data) {
      f.data = d("<" + this.settings.itemElement + "/>")
        .addClass(this.options.itemClass)
        .append(g);
    }
    this.trigger("prepared", { content: f.data });
    return f.data;
  };
  a.prototype.update = function () {
    var g = 0,
      j = this._pipe.length,
      h = d.proxy(function (i) {
        return this[i];
      }, this._invalidated),
      f = {};
    while (g < j) {
      if (this._invalidated.all || d.grep(this._pipe[g].filter, h).length > 0) {
        this._pipe[g].run(f);
      }
      g++;
    }
    this._invalidated = {};
    !this.is("valid") && this.enter("valid");
  };
  a.prototype.width = function (f) {
    f = f || a.Width.Default;
    switch (f) {
      case a.Width.Inner:
      case a.Width.Outer:
        return this._width;
      default:
        return (
          this._width - this.settings.stagePadding * 2 + this.settings.margin
        );
    }
  };
  a.prototype.refresh = function () {
    this.enter("refreshing");
    this.trigger("refresh");
    this.setup();
    this.optionsLogic();
    this.$element.addClass(this.options.refreshClass);
    this.update();
    this.$element.removeClass(this.options.refreshClass);
    this.leave("refreshing");
    this.trigger("refreshed");
  };
  a.prototype.onThrottledResize = function () {
    c.clearTimeout(this.resizeTimer);
    this.resizeTimer = c.setTimeout(
      this._handlers.onResize,
      this.settings.responsiveRefreshRate
    );
  };
  a.prototype.onResize = function () {
    if (!this._items.length) {
      return false;
    }
    if (this._width === this.$element.width()) {
      return false;
    }
    if (!this.$element.is(":visible")) {
      return false;
    }
    this.enter("resizing");
    if (this.trigger("resize").isDefaultPrevented()) {
      this.leave("resizing");
      return false;
    }
    this.invalidate("width");
    this.refresh();
    this.leave("resizing");
    this.trigger("resized");
  };
  a.prototype.registerEventHandlers = function () {
    if (d.support.transition) {
      this.$stage.on(
        d.support.transition.end + ".owl.core",
        d.proxy(this.onTransitionEnd, this)
      );
    }
    if (this.settings.responsive !== false) {
      this.on(c, "resize", this._handlers.onThrottledResize);
    }
    if (this.settings.mouseDrag) {
      this.$element.addClass(this.options.dragClass);
      this.$stage.on("mousedown.owl.core", d.proxy(this.onDragStart, this));
      this.$stage.on("dragstart.owl.core selectstart.owl.core", function () {
        return false;
      });
    }
    if (this.settings.touchDrag) {
      this.$stage.on("touchstart.owl.core", d.proxy(this.onDragStart, this));
      this.$stage.on("touchcancel.owl.core", d.proxy(this.onDragEnd, this));
    }
  };
  a.prototype.onDragStart = function (g) {
    var f = null;
    if (g.which === 3) {
      return;
    }
    if (d.support.transform) {
      f = this.$stage
        .css("transform")
        .replace(/.*\(|\)| /g, "")
        .split(",");
      f = { x: f[f.length === 16 ? 12 : 4], y: f[f.length === 16 ? 13 : 5] };
    } else {
      f = this.$stage.position();
      f = {
        x: this.settings.rtl
          ? f.left + this.$stage.width() - this.width() + this.settings.margin
          : f.left,
        y: f.top,
      };
    }
    if (this.is("animating")) {
      d.support.transform ? this.animate(f.x) : this.$stage.stop();
      this.invalidate("position");
    }
    this.$element.toggleClass(this.options.grabClass, g.type === "mousedown");
    this.speed(0);
    this._drag.time = new Date().getTime();
    this._drag.target = d(g.target);
    this._drag.stage.start = f;
    this._drag.stage.current = f;
    this._drag.pointer = this.pointer(g);
    d(b).on(
      "mouseup.owl.core touchend.owl.core",
      d.proxy(this.onDragEnd, this)
    );
    d(b).one(
      "mousemove.owl.core touchmove.owl.core",
      d.proxy(function (h) {
        var i = this.difference(this._drag.pointer, this.pointer(h));
        d(b).on(
          "mousemove.owl.core touchmove.owl.core",
          d.proxy(this.onDragMove, this)
        );
        if (Math.abs(i.x) < Math.abs(i.y) && this.is("valid")) {
          return;
        }
        h.preventDefault();
        this.enter("dragging");
        this.trigger("drag");
      }, this)
    );
  };
  a.prototype.onDragMove = function (g) {
    var i = null,
      j = null,
      h = null,
      k = this.difference(this._drag.pointer, this.pointer(g)),
      f = this.difference(this._drag.stage.start, k);
    if (!this.is("dragging")) {
      return;
    }
    g.preventDefault();
    if (this.settings.loop) {
      i = this.coordinates(this.minimum());
      j = this.coordinates(this.maximum() + 1) - i;
      f.x = ((((f.x - i) % j) + j) % j) + i;
    } else {
      i = this.settings.rtl
        ? this.coordinates(this.maximum())
        : this.coordinates(this.minimum());
      j = this.settings.rtl
        ? this.coordinates(this.minimum())
        : this.coordinates(this.maximum());
      h = this.settings.pullDrag ? (-1 * k.x) / 5 : 0;
      f.x = Math.max(Math.min(f.x, i + h), j + h);
    }
    this._drag.stage.current = f;
    this.animate(f.x);
  };
  a.prototype.onDragEnd = function (g) {
    var i = this.difference(this._drag.pointer, this.pointer(g)),
      f = this._drag.stage.current,
      h = (i.x > 0) ^ this.settings.rtl ? "left" : "right";
    d(b).off(".owl.core");
    this.$element.removeClass(this.options.grabClass);
    if ((i.x !== 0 && this.is("dragging")) || !this.is("valid")) {
      this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed);
      this.current(this.closest(f.x, i.x !== 0 ? h : this._drag.direction));
      this.invalidate("position");
      this.update();
      this._drag.direction = h;
      if (Math.abs(i.x) > 3 || new Date().getTime() - this._drag.time > 300) {
        this._drag.target.one("click.owl.core", function () {
          return false;
        });
      }
    }
    if (!this.is("dragging")) {
      return;
    }
    this.leave("dragging");
    this.trigger("dragged");
  };
  a.prototype.closest = function (k, i) {
    var f = -1,
      h = 30,
      g = this.width(),
      j = this.coordinates();
    if (!this.settings.freeDrag) {
      d.each(
        j,
        d.proxy(function (l, m) {
          if (i === "left" && k > m - h && k < m + h) {
            f = l;
          } else {
            if (i === "right" && k > m - g - h && k < m - g + h) {
              f = l + 1;
            } else {
              if (this.op(k, "<", m) && this.op(k, ">", j[l + 1] || m - g)) {
                f = i === "left" ? l + 1 : l;
              }
            }
          }
          return f === -1;
        }, this)
      );
    }
    if (!this.settings.loop) {
      if (this.op(k, ">", j[this.minimum()])) {
        f = k = this.minimum();
      } else {
        if (this.op(k, "<", j[this.maximum()])) {
          f = k = this.maximum();
        }
      }
    }
    return f;
  };
  a.prototype.animate = function (g) {
    var f = this.speed() > 0;
    this.is("animating") && this.onTransitionEnd();
    if (f) {
      this.enter("animating");
      this.trigger("translate");
    }
    if (d.support.transform3d && d.support.transition) {
      this.$stage.css({
        transform: "translate3d(" + g + "px,0px,0px)",
        transition: this.speed() / 1000 + "s",
      });
    } else {
      if (f) {
        this.$stage.animate(
          { left: g + "px" },
          this.speed(),
          this.settings.fallbackEasing,
          d.proxy(this.onTransitionEnd, this)
        );
      } else {
        this.$stage.css({ left: g + "px" });
      }
    }
  };
  a.prototype.is = function (f) {
    return this._states.current[f] && this._states.current[f] > 0;
  };
  a.prototype.current = function (f) {
    if (f === e) {
      return this._current;
    }
    if (this._items.length === 0) {
      return e;
    }
    f = this.normalize(f);
    if (this._current !== f) {
      var g = this.trigger("change", {
        property: { name: "position", value: f },
      });
      if (g.data !== e) {
        f = this.normalize(g.data);
      }
      this._current = f;
      this.invalidate("position");
      this.trigger("changed", {
        property: { name: "position", value: this._current },
      });
    }
    return this._current;
  };
  a.prototype.invalidate = function (f) {
    if (d.type(f) === "string") {
      this._invalidated[f] = true;
      this.is("valid") && this.leave("valid");
    }
    return d.map(this._invalidated, function (g, h) {
      return h;
    });
  };
  a.prototype.reset = function (f) {
    f = this.normalize(f);
    if (f === e) {
      return;
    }
    this._speed = 0;
    this._current = f;
    this.suppress(["translate", "translated"]);
    this.animate(this.coordinates(f));
    this.release(["translate", "translated"]);
  };
  a.prototype.normalize = function (g, h) {
    var i = this._items.length,
      f = h ? 0 : this._clones.length;
    if (!this.isNumeric(g) || i < 1) {
      g = e;
    } else {
      if (g < 0 || g >= i + f) {
        g = ((((g - f / 2) % i) + i) % i) + f / 2;
      }
    }
    return g;
  };
  a.prototype.relative = function (f) {
    f -= this._clones.length / 2;
    return this.normalize(f, true);
  };
  a.prototype.maximum = function (j) {
    var g = this.settings,
      k = this._coordinates.length,
      f,
      i,
      h;
    if (g.loop) {
      k = this._clones.length / 2 + this._items.length - 1;
    } else {
      if (g.autoWidth || g.merge) {
        f = this._items.length;
        i = this._items[--f].width();
        h = this.$element.width();
        while (f--) {
          i += this._items[f].width() + this.settings.margin;
          if (i > h) {
            break;
          }
        }
        k = f + 1;
      } else {
        if (g.center) {
          k = this._items.length - 1;
        } else {
          k = this._items.length - g.items;
        }
      }
    }
    if (j) {
      k -= this._clones.length / 2;
    }
    return Math.max(k, 0);
  };
  a.prototype.minimum = function (f) {
    return f ? 0 : this._clones.length / 2;
  };
  a.prototype.items = function (f) {
    if (f === e) {
      return this._items.slice();
    }
    f = this.normalize(f, true);
    return this._items[f];
  };
  a.prototype.mergers = function (f) {
    if (f === e) {
      return this._mergers.slice();
    }
    f = this.normalize(f, true);
    return this._mergers[f];
  };
  a.prototype.clones = function (f) {
    var g = this._clones.length / 2,
      i = g + this._items.length,
      h = function (j) {
        return j % 2 === 0 ? i + j / 2 : g - (j + 1) / 2;
      };
    if (f === e) {
      return d.map(this._clones, function (j, k) {
        return h(k);
      });
    }
    return d.map(this._clones, function (j, k) {
      return j === f ? h(k) : null;
    });
  };
  a.prototype.speed = function (f) {
    if (f !== e) {
      this._speed = f;
    }
    return this._speed;
  };
  a.prototype.coordinates = function (f) {
    var i = 1,
      g = f - 1,
      h;
    if (f === e) {
      return d.map(
        this._coordinates,
        d.proxy(function (k, j) {
          return this.coordinates(j);
        }, this)
      );
    }
    if (this.settings.center) {
      if (this.settings.rtl) {
        i = -1;
        g = f + 1;
      }
      h = this._coordinates[f];
      h += ((this.width() - h + (this._coordinates[g] || 0)) / 2) * i;
    } else {
      h = this._coordinates[g] || 0;
    }
    h = Math.ceil(h);
    return h;
  };
  a.prototype.duration = function (h, g, f) {
    if (f === 0) {
      return 0;
    }
    return (
      Math.min(Math.max(Math.abs(g - h), 1), 6) *
      Math.abs(f || this.settings.smartSpeed)
    );
  };
  a.prototype.to = function (i, g) {
    var j = this.current(),
      m = null,
      f = i - this.relative(j),
      n = (f > 0) - (f < 0),
      l = this._items.length,
      k = this.minimum(),
      h = this.maximum();
    if (this.settings.loop) {
      if (!this.settings.rewind && Math.abs(f) > l / 2) {
        f += n * -1 * l;
      }
      i = j + f;
      m = ((((i - k) % l) + l) % l) + k;
      if (m !== i && m - f <= h && m - f > 0) {
        j = m - f;
        i = m;
        this.reset(j);
      }
    } else {
      if (this.settings.rewind) {
        h += 1;
        i = ((i % h) + h) % h;
      } else {
        i = Math.max(k, Math.min(h, i));
      }
    }
    this.speed(this.duration(j, i, g));
    this.current(i);
    if (this.$element.is(":visible")) {
      this.update();
    }
  };
  a.prototype.next = function (f) {
    f = f || false;
    this.to(this.relative(this.current()) + 1, f);
  };
  a.prototype.prev = function (f) {
    f = f || false;
    this.to(this.relative(this.current()) - 1, f);
  };
  a.prototype.onTransitionEnd = function (f) {
    if (f !== e) {
      f.stopPropagation();
      if (
        (f.target || f.srcElement || f.originalTarget) !== this.$stage.get(0)
      ) {
        return false;
      }
    }
    this.leave("animating");
    this.trigger("translated");
  };
  a.prototype.viewport = function () {
    var f;
    if (this.options.responsiveBaseElement !== c) {
      f = d(this.options.responsiveBaseElement).width();
    } else {
      if (c.innerWidth) {
        f = c.innerWidth;
      } else {
        if (b.documentElement && b.documentElement.clientWidth) {
          f = b.documentElement.clientWidth;
        } else {
          throw "Can not detect viewport width.";
        }
      }
    }
    return f;
  };
  a.prototype.replace = function (f) {
    this.$stage.empty();
    this._items = [];
    if (f) {
      f = f instanceof jQuery ? f : d(f);
    }
    if (this.settings.nestedItemSelector) {
      f = f.find("." + this.settings.nestedItemSelector);
    }
    f.filter(function () {
      return this.nodeType === 1;
    }).each(
      d.proxy(function (g, h) {
        h = this.prepare(h);
        this.$stage.append(h);
        this._items.push(h);
        this._mergers.push(
          h.find("[data-merge]").addBack("[data-merge]").attr("data-merge") *
            1 || 1
        );
      }, this)
    );
    this.reset(
      this.isNumeric(this.settings.startPosition)
        ? this.settings.startPosition
        : 0
    );
    this.invalidate("items");
  };
  a.prototype.add = function (g, f) {
    var h = this.relative(this._current);
    f = f === e ? this._items.length : this.normalize(f, true);
    g = g instanceof jQuery ? g : d(g);
    this.trigger("add", { content: g, position: f });
    g = this.prepare(g);
    if (this._items.length === 0 || f === this._items.length) {
      this._items.length === 0 && this.$stage.append(g);
      this._items.length !== 0 && this._items[f - 1].after(g);
      this._items.push(g);
      this._mergers.push(
        g.find("[data-merge]").addBack("[data-merge]").attr("data-merge") * 1 ||
          1
      );
    } else {
      this._items[f].before(g);
      this._items.splice(f, 0, g);
      this._mergers.splice(
        f,
        0,
        g.find("[data-merge]").addBack("[data-merge]").attr("data-merge") * 1 ||
          1
      );
    }
    this._items[h] && this.reset(this._items[h].index());
    this.invalidate("items");
    this.trigger("added", { content: g, position: f });
  };
  a.prototype.remove = function (f) {
    f = this.normalize(f, true);
    if (f === e) {
      return;
    }
    this.trigger("remove", { content: this._items[f], position: f });
    this._items[f].remove();
    this._items.splice(f, 1);
    this._mergers.splice(f, 1);
    this.invalidate("items");
    this.trigger("removed", { content: null, position: f });
  };
  a.prototype.preloadAutoWidthImages = function (f) {
    f.each(
      d.proxy(function (h, g) {
        this.enter("pre-loading");
        g = d(g);
        d(new Image())
          .one(
            "load",
            d.proxy(function (i) {
              g.attr("src", i.target.src);
              g.css("opacity", 1);
              this.leave("pre-loading");
              !this.is("pre-loading") &&
                !this.is("initializing") &&
                this.refresh();
            }, this)
          )
          .attr(
            "src",
            g.attr("src") || g.attr("data-src") || g.attr("data-src-retina")
          );
      }, this)
    );
  };
  a.prototype.destroy = function () {
    this.$element.off(".owl.core");
    this.$stage.off(".owl.core");
    d(b).off(".owl.core");
    if (this.settings.responsive !== false) {
      c.clearTimeout(this.resizeTimer);
      this.off(c, "resize", this._handlers.onThrottledResize);
    }
    for (var f in this._plugins) {
      this._plugins[f].destroy();
    }
    this.$stage.children(".cloned").remove();
    this.$stage.unwrap();
    this.$stage.children().contents().unwrap();
    this.$stage.children().unwrap();
    this.$element
      .removeClass(this.options.refreshClass)
      .removeClass(this.options.loadingClass)
      .removeClass(this.options.loadedClass)
      .removeClass(this.options.rtlClass)
      .removeClass(this.options.dragClass)
      .removeClass(this.options.grabClass)
      .attr(
        "class",
        this.$element
          .attr("class")
          .replace(
            new RegExp(this.options.responsiveClass + "-\\S+\\s", "g"),
            ""
          )
      )
      .removeData("owl.carousel");
  };
  a.prototype.op = function (g, i, f) {
    var h = this.settings.rtl;
    switch (i) {
      case "<":
        return h ? g > f : g < f;
      case ">":
        return h ? g < f : g > f;
      case ">=":
        return h ? g <= f : g >= f;
      case "<=":
        return h ? g >= f : g <= f;
      default:
        break;
    }
  };
  a.prototype.on = function (g, h, i, f) {
    if (g.addEventListener) {
      g.addEventListener(h, i, f);
    } else {
      if (g.attachEvent) {
        g.attachEvent("on" + h, i);
      }
    }
  };
  a.prototype.off = function (g, h, i, f) {
    if (g.removeEventListener) {
      g.removeEventListener(h, i, f);
    } else {
      if (g.detachEvent) {
        g.detachEvent("on" + h, i);
      }
    }
  };
  a.prototype.trigger = function (g, l, i, k, m) {
    var f = { item: { count: this._items.length, index: this.current() } },
      h = d.camelCase(
        d
          .grep(["on", g, i], function (n) {
            return n;
          })
          .join("-")
          .toLowerCase()
      ),
      j = d.Event(
        [g, "owl", i || "carousel"].join(".").toLowerCase(),
        d.extend({ relatedTarget: this }, f, l)
      );
    if (!this._supress[g]) {
      d.each(this._plugins, function (n, o) {
        if (o.onTrigger) {
          o.onTrigger(j);
        }
      });
      this.register({ type: a.Type.Event, name: g });
      this.$element.trigger(j);
      if (this.settings && typeof this.settings[h] === "function") {
        this.settings[h].call(this, j);
      }
    }
    return j;
  };
  a.prototype.enter = function (f) {
    d.each(
      [f].concat(this._states.tags[f] || []),
      d.proxy(function (h, g) {
        if (this._states.current[g] === e) {
          this._states.current[g] = 0;
        }
        this._states.current[g]++;
      }, this)
    );
  };
  a.prototype.leave = function (f) {
    d.each(
      [f].concat(this._states.tags[f] || []),
      d.proxy(function (h, g) {
        this._states.current[g]--;
      }, this)
    );
  };
  a.prototype.register = function (g) {
    if (g.type === a.Type.Event) {
      if (!d.event.special[g.name]) {
        d.event.special[g.name] = {};
      }
      if (!d.event.special[g.name].owl) {
        var f = d.event.special[g.name]._default;
        d.event.special[g.name]._default = function (h) {
          if (
            f &&
            f.apply &&
            (!h.namespace || h.namespace.indexOf("owl") === -1)
          ) {
            return f.apply(this, arguments);
          }
          return h.namespace && h.namespace.indexOf("owl") > -1;
        };
        d.event.special[g.name].owl = true;
      }
    } else {
      if (g.type === a.Type.State) {
        if (!this._states.tags[g.name]) {
          this._states.tags[g.name] = g.tags;
        } else {
          this._states.tags[g.name] = this._states.tags[g.name].concat(g.tags);
        }
        this._states.tags[g.name] = d.grep(
          this._states.tags[g.name],
          d.proxy(function (h, j) {
            return d.inArray(h, this._states.tags[g.name]) === j;
          }, this)
        );
      }
    }
  };
  a.prototype.suppress = function (f) {
    d.each(
      f,
      d.proxy(function (g, h) {
        this._supress[h] = true;
      }, this)
    );
  };
  a.prototype.release = function (f) {
    d.each(
      f,
      d.proxy(function (g, h) {
        delete this._supress[h];
      }, this)
    );
  };
  a.prototype.pointer = function (g) {
    var f = { x: null, y: null };
    g = g.originalEvent || g || c.event;
    g =
      g.touches && g.touches.length
        ? g.touches[0]
        : g.changedTouches && g.changedTouches.length
        ? g.changedTouches[0]
        : g;
    if (g.pageX) {
      f.x = g.pageX;
      f.y = g.pageY;
    } else {
      f.x = g.clientX;
      f.y = g.clientY;
    }
    return f;
  };
  a.prototype.isNumeric = function (f) {
    return !isNaN(parseFloat(f));
  };
  a.prototype.difference = function (g, f) {
    return { x: g.x - f.x, y: g.y - f.y };
  };
  d.fn.owlCarousel = function (g) {
    var f = Array.prototype.slice.call(arguments, 1);
    return this.each(function () {
      var i = d(this),
        h = i.data("owl.carousel");
      if (!h) {
        h = new a(this, typeof g == "object" && g);
        i.data("owl.carousel", h);
        d.each(
          [
            "next",
            "prev",
            "to",
            "destroy",
            "refresh",
            "replace",
            "add",
            "remove",
          ],
          function (j, k) {
            h.register({ type: a.Type.Event, name: k });
            h.$element.on(
              k + ".owl.carousel.core",
              d.proxy(function (l) {
                if (l.namespace && l.relatedTarget !== this) {
                  this.suppress([k]);
                  h[k].apply(this, [].slice.call(arguments, 1));
                  this.release([k]);
                }
              }, h)
            );
          }
        );
      }
      if (typeof g == "string" && g.charAt(0) !== "_") {
        h[g].apply(h, f);
      }
    });
  };
  d.fn.owlCarousel.Constructor = a;
})(window.Zepto || window.jQuery, window, document);
(function (d, c, a, e) {
  var b = function (f) {
    this._core = f;
    this._interval = null;
    this._visible = null;
    this._handlers = {
      "initialized.owl.carousel": d.proxy(function (g) {
        if (g.namespace && this._core.settings.autoRefresh) {
          this.watch();
        }
      }, this),
    };
    this._core.options = d.extend({}, b.Defaults, this._core.options);
    this._core.$element.on(this._handlers);
  };
  b.Defaults = { autoRefresh: true, autoRefreshInterval: 500 };
  b.prototype.watch = function () {
    if (this._interval) {
      return;
    }
    this._visible = this._core.$element.is(":visible");
    this._interval = c.setInterval(
      d.proxy(this.refresh, this),
      this._core.settings.autoRefreshInterval
    );
  };
  b.prototype.refresh = function () {
    if (this._core.$element.is(":visible") === this._visible) {
      return;
    }
    this._visible = !this._visible;
    this._core.$element.toggleClass("owl-hidden", !this._visible);
    this._visible && this._core.invalidate("width") && this._core.refresh();
  };
  b.prototype.destroy = function () {
    var f, g;
    c.clearInterval(this._interval);
    for (f in this._handlers) {
      this._core.$element.off(f, this._handlers[f]);
    }
    for (g in Object.getOwnPropertyNames(this)) {
      typeof this[g] != "function" && (this[g] = null);
    }
  };
  d.fn.owlCarousel.Constructor.Plugins.AutoRefresh = b;
})(window.Zepto || window.jQuery, window, document);
(function (d, c, a, e) {
  var b = function (f) {
    this._core = f;
    this._loaded = [];
    this._handlers = {
      "initialized.owl.carousel change.owl.carousel resized.owl.carousel":
        d.proxy(function (m) {
          if (!m.namespace) {
            return;
          }
          if (!this._core.settings || !this._core.settings.lazyLoad) {
            return;
          }
          if (
            (m.property && m.property.name == "position") ||
            m.type == "initialized"
          ) {
            var j = this._core.settings,
              o = (j.center && Math.ceil(j.items / 2)) || j.items,
              h = (j.center && o * -1) || 0,
              g =
                (m.property && m.property.value !== e
                  ? m.property.value
                  : this._core.current()) + h,
              l = this._core.clones().length,
              k = d.proxy(function (p, n) {
                this.load(n);
              }, this);
            while (h++ < o) {
              this.load(l / 2 + this._core.relative(g));
              l && d.each(this._core.clones(this._core.relative(g)), k);
              g++;
            }
          }
        }, this),
    };
    this._core.options = d.extend({}, b.Defaults, this._core.options);
    this._core.$element.on(this._handlers);
  };
  b.Defaults = { lazyLoad: false };
  b.prototype.load = function (f) {
    var g = this._core.$stage.children().eq(f),
      h = g && g.find(".owl-lazy");
    if (!h || d.inArray(g.get(0), this._loaded) > -1) {
      return;
    }
    h.each(
      d.proxy(function (k, l) {
        var i = d(l),
          m,
          j =
            (c.devicePixelRatio > 1 && i.attr("data-src-retina")) ||
            i.attr("data-src");
        this._core.trigger("load", { element: i, url: j }, "lazy");
        if (i.is("img")) {
          i.one(
            "load.owl.lazy",
            d.proxy(function () {
              i.css("opacity", 1);
              this._core.trigger("loaded", { element: i, url: j }, "lazy");
            }, this)
          ).attr("src", j);
        } else {
          m = new Image();
          m.onload = d.proxy(function () {
            i.css({ "background-image": "url(" + j + ")", opacity: "1" });
            this._core.trigger("loaded", { element: i, url: j }, "lazy");
          }, this);
          m.src = j;
        }
      }, this)
    );
    this._loaded.push(g.get(0));
  };
  b.prototype.destroy = function () {
    var f, g;
    for (f in this.handlers) {
      this._core.$element.off(f, this.handlers[f]);
    }
    for (g in Object.getOwnPropertyNames(this)) {
      typeof this[g] != "function" && (this[g] = null);
    }
  };
  d.fn.owlCarousel.Constructor.Plugins.Lazy = b;
})(window.Zepto || window.jQuery, window, document);
(function (c, b, a, d) {
  var e = function (f) {
    this._core = f;
    this._handlers = {
      "initialized.owl.carousel refreshed.owl.carousel": c.proxy(function (g) {
        if (g.namespace && this._core.settings.autoHeight) {
          this.update();
        }
      }, this),
      "changed.owl.carousel": c.proxy(function (g) {
        if (
          g.namespace &&
          this._core.settings.autoHeight &&
          g.property.name == "position"
        ) {
          this.update();
        }
      }, this),
      "loaded.owl.lazy": c.proxy(function (g) {
        if (
          g.namespace &&
          this._core.settings.autoHeight &&
          g.element.closest("." + this._core.settings.itemClass).index() ===
            this._core.current()
        ) {
          this.update();
        }
      }, this),
    };
    this._core.options = c.extend({}, e.Defaults, this._core.options);
    this._core.$element.on(this._handlers);
  };
  e.Defaults = { autoHeight: false, autoHeightClass: "owl-height" };
  e.prototype.update = function () {
    var j = this._core._current,
      f = j + this._core.settings.items,
      i = this._core.$stage.children().toArray().slice(j, f),
      g = [],
      h = 0;
    c.each(i, function (k, l) {
      g.push(c(l).height());
    });
    h = Math.max.apply(null, g);
    this._core.$stage
      .parent()
      .height(h)
      .addClass(this._core.settings.autoHeightClass);
  };
  e.prototype.destroy = function () {
    var f, g;
    for (f in this._handlers) {
      this._core.$element.off(f, this._handlers[f]);
    }
    for (g in Object.getOwnPropertyNames(this)) {
      typeof this[g] != "function" && (this[g] = null);
    }
  };
  c.fn.owlCarousel.Constructor.Plugins.AutoHeight = e;
})(window.Zepto || window.jQuery, window, document);
(function (d, c, a, e) {
  var b = function (f) {
    this._core = f;
    this._videos = {};
    this._playing = null;
    this._handlers = {
      "initialized.owl.carousel": d.proxy(function (g) {
        if (g.namespace) {
          this._core.register({
            type: "state",
            name: "playing",
            tags: ["interacting"],
          });
        }
      }, this),
      "resize.owl.carousel": d.proxy(function (g) {
        if (g.namespace && this._core.settings.video && this.isInFullScreen()) {
          g.preventDefault();
        }
      }, this),
      "refreshed.owl.carousel": d.proxy(function (g) {
        if (g.namespace && this._core.is("resizing")) {
          this._core.$stage.find(".cloned .owl-video-frame").remove();
        }
      }, this),
      "changed.owl.carousel": d.proxy(function (g) {
        if (g.namespace && g.property.name === "position" && this._playing) {
          this.stop();
        }
      }, this),
      "prepared.owl.carousel": d.proxy(function (h) {
        if (!h.namespace) {
          return;
        }
        var g = d(h.content).find(".owl-video");
        if (g.length) {
          g.css("display", "none");
          this.fetch(g, d(h.content));
        }
      }, this),
    };
    this._core.options = d.extend({}, b.Defaults, this._core.options);
    this._core.$element.on(this._handlers);
    this._core.$element.on(
      "click.owl.video",
      ".owl-video-play-icon",
      d.proxy(function (g) {
        this.play(g);
      }, this)
    );
  };
  b.Defaults = { video: false, videoHeight: false, videoWidth: false };
  b.prototype.fetch = function (k, j) {
    var i = (function () {
        if (k.attr("data-vimeo-id")) {
          return "vimeo";
        } else {
          if (k.attr("data-vzaar-id")) {
            return "vzaar";
          } else {
            return "youtube";
          }
        }
      })(),
      l =
        k.attr("data-vimeo-id") ||
        k.attr("data-youtube-id") ||
        k.attr("data-vzaar-id"),
      h = k.attr("data-width") || this._core.settings.videoWidth,
      f = k.attr("data-height") || this._core.settings.videoHeight,
      g = k.attr("href");
    if (g) {
      l = g.match(
        /(http:|https:|)\/\/(player.|www.|app.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com)|vzaar\.com)\/(video\/|videos\/|embed\/|channels\/.+\/|groups\/.+\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/
      );
      if (l[3].indexOf("youtu") > -1) {
        i = "youtube";
      } else {
        if (l[3].indexOf("vimeo") > -1) {
          i = "vimeo";
        } else {
          if (l[3].indexOf("vzaar") > -1) {
            i = "vzaar";
          } else {
            throw new Error("Video URL not supported.");
          }
        }
      }
      l = l[6];
    } else {
      throw new Error("Missing video URL.");
    }
    this._videos[g] = { type: i, id: l, width: h, height: f };
    j.attr("data-video", g);
    this.thumbnail(k, this._videos[g]);
  };
  b.prototype.thumbnail = function (l, h) {
    var g,
      n,
      p,
      f =
        h.width && h.height
          ? 'style="width:' + h.width + "px;height:" + h.height + 'px;"'
          : "",
      m = l.find("img"),
      o = "src",
      k = "",
      i = this._core.settings,
      j = function (q) {
        n = '<div class="owl-video-play-icon"></div>';
        if (i.lazyLoad) {
          g =
            '<div class="owl-video-tn ' + k + '" ' + o + '="' + q + '"></div>';
        } else {
          g =
            '<div class="owl-video-tn" style="opacity:1;background-image:url(' +
            q +
            ')"></div>';
        }
        l.after(g);
        l.after(n);
      };
    l.wrap('<div class="owl-video-wrapper"' + f + "></div>");
    if (this._core.settings.lazyLoad) {
      o = "data-src";
      k = "owl-lazy";
    }
    if (m.length) {
      j(m.attr(o));
      m.remove();
      return false;
    }
    if (h.type === "youtube") {
      p = "//img.youtube.com/vi/" + h.id + "/hqdefault.jpg";
      j(p);
    } else {
      if (h.type === "vimeo") {
        d.ajax({
          type: "GET",
          url: "//vimeo.com/api/v2/video/" + h.id + ".json",
          jsonp: "callback",
          dataType: "jsonp",
          success: function (q) {
            p = q[0].thumbnail_large;
            j(p);
          },
        });
      } else {
        if (h.type === "vzaar") {
          d.ajax({
            type: "GET",
            url: "//vzaar.com/api/videos/" + h.id + ".json",
            jsonp: "callback",
            dataType: "jsonp",
            success: function (q) {
              p = q.framegrab_url;
              j(p);
            },
          });
        }
      }
    }
  };
  b.prototype.stop = function () {
    this._core.trigger("stop", null, "video");
    this._playing.find(".owl-video-frame").remove();
    this._playing.removeClass("owl-video-playing");
    this._playing = null;
    this._core.leave("playing");
    this._core.trigger("stopped", null, "video");
  };
  b.prototype.play = function (k) {
    var l = d(k.target),
      j = l.closest("." + this._core.settings.itemClass),
      i = this._videos[j.attr("data-video")],
      h = i.width || "100%",
      f = i.height || this._core.$stage.height(),
      g;
    if (this._playing) {
      return;
    }
    this._core.enter("playing");
    this._core.trigger("play", null, "video");
    j = this._core.items(this._core.relative(j.index()));
    this._core.reset(j.index());
    if (i.type === "youtube") {
      g =
        '<iframe width="' +
        h +
        '" height="' +
        f +
        '" src="//www.youtube.com/embed/' +
        i.id +
        "?autoplay=1&v=" +
        i.id +
        '" frameborder="0" allowfullscreen></iframe>';
    } else {
      if (i.type === "vimeo") {
        g =
          '<iframe src="//player.vimeo.com/video/' +
          i.id +
          '?autoplay=1" width="' +
          h +
          '" height="' +
          f +
          '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
      } else {
        if (i.type === "vzaar") {
          g =
            '<iframe frameborder="0"height="' +
            f +
            '"width="' +
            h +
            '" allowfullscreen mozallowfullscreen webkitAllowFullScreen src="//view.vzaar.com/' +
            i.id +
            '/player?autoplay=true"></iframe>';
        }
      }
    }
    d('<div class="owl-video-frame">' + g + "</div>").insertAfter(
      j.find(".owl-video")
    );
    this._playing = j.addClass("owl-video-playing");
  };
  b.prototype.isInFullScreen = function () {
    var f =
      a.fullscreenElement ||
      a.mozFullScreenElement ||
      a.webkitFullscreenElement;
    return f && d(f).parent().hasClass("owl-video-frame");
  };
  b.prototype.destroy = function () {
    var f, g;
    this._core.$element.off("click.owl.video");
    for (f in this._handlers) {
      this._core.$element.off(f, this._handlers[f]);
    }
    for (g in Object.getOwnPropertyNames(this)) {
      typeof this[g] != "function" && (this[g] = null);
    }
  };
  d.fn.owlCarousel.Constructor.Plugins.Video = b;
})(window.Zepto || window.jQuery, window, document);
(function (d, c, b, e) {
  var a = function (f) {
    this.core = f;
    this.core.options = d.extend({}, a.Defaults, this.core.options);
    this.swapping = true;
    this.previous = e;
    this.next = e;
    this.handlers = {
      "change.owl.carousel": d.proxy(function (g) {
        if (g.namespace && g.property.name == "position") {
          this.previous = this.core.current();
          this.next = g.property.value;
        }
      }, this),
      "drag.owl.carousel dragged.owl.carousel translated.owl.carousel": d.proxy(
        function (g) {
          if (g.namespace) {
            this.swapping = g.type == "translated";
          }
        },
        this
      ),
      "translate.owl.carousel": d.proxy(function (g) {
        if (
          g.namespace &&
          this.swapping &&
          (this.core.options.animateOut || this.core.options.animateIn)
        ) {
          this.swap();
        }
      }, this),
    };
    this.core.$element.on(this.handlers);
  };
  a.Defaults = { animateOut: false, animateIn: false };
  a.prototype.swap = function () {
    if (this.core.settings.items !== 1) {
      return;
    }
    if (!d.support.animation || !d.support.transition) {
      return;
    }
    this.core.speed(0);
    var k,
      f = d.proxy(this.clear, this),
      j = this.core.$stage.children().eq(this.previous),
      i = this.core.$stage.children().eq(this.next),
      g = this.core.settings.animateIn,
      h = this.core.settings.animateOut;
    if (this.core.current() === this.previous) {
      return;
    }
    if (h) {
      k =
        this.core.coordinates(this.previous) - this.core.coordinates(this.next);
      j.one(d.support.animation.end, f)
        .css({ left: k + "px" })
        .addClass("animated owl-animated-out")
        .addClass(h);
    }
    if (g) {
      i.one(d.support.animation.end, f)
        .addClass("animated owl-animated-in")
        .addClass(g);
    }
  };
  a.prototype.clear = function (f) {
    d(f.target)
      .css({ left: "" })
      .removeClass("animated owl-animated-out owl-animated-in")
      .removeClass(this.core.settings.animateIn)
      .removeClass(this.core.settings.animateOut);
    this.core.onTransitionEnd();
  };
  a.prototype.destroy = function () {
    var f, g;
    for (f in this.handlers) {
      this.core.$element.off(f, this.handlers[f]);
    }
    for (g in Object.getOwnPropertyNames(this)) {
      typeof this[g] != "function" && (this[g] = null);
    }
  };
  d.fn.owlCarousel.Constructor.Plugins.Animate = a;
})(window.Zepto || window.jQuery, window, document);
(function (c, b, a, e) {
  var d = function (f) {
    this._core = f;
    this._timeout = null;
    this._paused = false;
    this._handlers = {
      "changed.owl.carousel": c.proxy(function (g) {
        if (g.namespace && g.property.name === "settings") {
          if (this._core.settings.autoplay) {
            this.play();
          } else {
            this.stop();
          }
        } else {
          if (g.namespace && g.property.name === "position") {
            if (this._core.settings.autoplay) {
              this._setAutoPlayInterval();
            }
          }
        }
      }, this),
      "initialized.owl.carousel": c.proxy(function (g) {
        if (g.namespace && this._core.settings.autoplay) {
          this.play();
        }
      }, this),
      "play.owl.autoplay": c.proxy(function (i, g, h) {
        if (i.namespace) {
          this.play(g, h);
        }
      }, this),
      "stop.owl.autoplay": c.proxy(function (g) {
        if (g.namespace) {
          this.stop();
        }
      }, this),
      "mouseover.owl.autoplay": c.proxy(function () {
        if (
          this._core.settings.autoplayHoverPause &&
          this._core.is("rotating")
        ) {
          this.pause();
        }
      }, this),
      "mouseleave.owl.autoplay": c.proxy(function () {
        if (
          this._core.settings.autoplayHoverPause &&
          this._core.is("rotating")
        ) {
          this.play();
        }
      }, this),
      "touchstart.owl.core": c.proxy(function () {
        if (
          this._core.settings.autoplayHoverPause &&
          this._core.is("rotating")
        ) {
          this.pause();
        }
      }, this),
      "touchend.owl.core": c.proxy(function () {
        if (this._core.settings.autoplayHoverPause) {
          this.play();
        }
      }, this),
    };
    this._core.$element.on(this._handlers);
    this._core.options = c.extend({}, d.Defaults, this._core.options);
  };
  d.Defaults = {
    autoplay: false,
    autoplayTimeout: 5000,
    autoplayHoverPause: false,
    autoplaySpeed: false,
  };
  d.prototype.play = function (g, f) {
    this._paused = false;
    if (this._core.is("rotating")) {
      return;
    }
    this._core.enter("rotating");
    this._setAutoPlayInterval();
  };
  d.prototype._getNextTimeout = function (g, f) {
    if (this._timeout) {
      b.clearTimeout(this._timeout);
    }
    return b.setTimeout(
      c.proxy(function () {
        if (
          this._paused ||
          this._core.is("busy") ||
          this._core.is("interacting") ||
          a.hidden
        ) {
          return;
        }
        this._core.next(f || this._core.settings.autoplaySpeed);
      }, this),
      g || this._core.settings.autoplayTimeout
    );
  };
  d.prototype._setAutoPlayInterval = function () {
    this._timeout = this._getNextTimeout();
  };
  d.prototype.stop = function () {
    if (!this._core.is("rotating")) {
      return;
    }
    b.clearTimeout(this._timeout);
    this._core.leave("rotating");
  };
  d.prototype.pause = function () {
    if (!this._core.is("rotating")) {
      return;
    }
    this._paused = true;
  };
  d.prototype.destroy = function () {
    var f, g;
    this.stop();
    for (f in this._handlers) {
      this._core.$element.off(f, this._handlers[f]);
    }
    for (g in Object.getOwnPropertyNames(this)) {
      typeof this[g] != "function" && (this[g] = null);
    }
  };
  c.fn.owlCarousel.Constructor.Plugins.autoplay = d;
})(window.Zepto || window.jQuery, window, document);
(function (d, b, a, e) {
  var c = function (f) {
    this._core = f;
    this._initialized = false;
    this._pages = [];
    this._controls = {};
    this._templates = [];
    this.$element = this._core.$element;
    this._overrides = {
      next: this._core.next,
      prev: this._core.prev,
      to: this._core.to,
    };
    this._handlers = {
      "prepared.owl.carousel": d.proxy(function (g) {
        if (g.namespace && this._core.settings.dotsData) {
          this._templates.push(
            '<div class="' +
              this._core.settings.dotClass +
              '">' +
              d(g.content)
                .find("[data-dot]")
                .addBack("[data-dot]")
                .attr("data-dot") +
              "</div>"
          );
        }
      }, this),
      "added.owl.carousel": d.proxy(function (g) {
        if (g.namespace && this._core.settings.dotsData) {
          this._templates.splice(g.position, 0, this._templates.pop());
        }
      }, this),
      "remove.owl.carousel": d.proxy(function (g) {
        if (g.namespace && this._core.settings.dotsData) {
          this._templates.splice(g.position, 1);
        }
      }, this),
      "changed.owl.carousel": d.proxy(function (g) {
        if (g.namespace && g.property.name == "position") {
          this.draw();
        }
      }, this),
      "initialized.owl.carousel": d.proxy(function (g) {
        if (g.namespace && !this._initialized) {
          this._core.trigger("initialize", null, "navigation");
          this.initialize();
          this.update();
          this.draw();
          this._initialized = true;
          this._core.trigger("initialized", null, "navigation");
        }
      }, this),
      "refreshed.owl.carousel": d.proxy(function (g) {
        if (g.namespace && this._initialized) {
          this._core.trigger("refresh", null, "navigation");
          this.update();
          this.draw();
          this._core.trigger("refreshed", null, "navigation");
        }
      }, this),
    };
    this._core.options = d.extend({}, c.Defaults, this._core.options);
    this.$element.on(this._handlers);
  };
  c.Defaults = {
    nav: false,
    navText: ["prev", "next"],
    navSpeed: false,
    navElement: "div",
    navContainer: false,
    navContainerClass: "owl-nav",
    navClass: ["owl-prev", "owl-next"],
    slideBy: 1,
    dotClass: "owl-dot",
    dotsClass: "owl-dots",
    dots: true,
    dotsEach: false,
    dotsData: false,
    dotsSpeed: false,
    dotsContainer: false,
  };
  c.prototype.initialize = function () {
    var f,
      g = this._core.settings;
    this._controls.$relative = (
      g.navContainer
        ? d(g.navContainer)
        : d("<div>").addClass(g.navContainerClass).appendTo(this.$element)
    ).addClass("disabled");
    this._controls.$previous = d("<" + g.navElement + ">")
      .addClass(g.navClass[0])
      .html(g.navText[0])
      .prependTo(this._controls.$relative)
      .on(
        "click",
        d.proxy(function (h) {
          this.prev(g.navSpeed);
        }, this)
      );
    this._controls.$next = d("<" + g.navElement + ">")
      .addClass(g.navClass[1])
      .html(g.navText[1])
      .appendTo(this._controls.$relative)
      .on(
        "click",
        d.proxy(function (h) {
          this.next(g.navSpeed);
        }, this)
      );
    if (!g.dotsData) {
      this._templates = [
        d("<div>").addClass(g.dotClass).append(d("<span>")).prop("outerHTML"),
      ];
    }
    this._controls.$absolute = (
      g.dotsContainer
        ? d(g.dotsContainer)
        : d("<div>").addClass(g.dotsClass).appendTo(this.$element)
    ).addClass("disabled");
    this._controls.$absolute.on(
      "click",
      "div",
      d.proxy(function (i) {
        var h = d(i.target).parent().is(this._controls.$absolute)
          ? d(i.target).index()
          : d(i.target).parent().index();
        i.preventDefault();
        this.to(h, g.dotsSpeed);
      }, this)
    );
    for (f in this._overrides) {
      this._core[f] = d.proxy(this[f], this);
    }
  };
  c.prototype.destroy = function () {
    var g, i, h, f;
    for (g in this._handlers) {
      this.$element.off(g, this._handlers[g]);
    }
    for (i in this._controls) {
      this._controls[i].remove();
    }
    for (f in this.overides) {
      this._core[f] = this._overrides[f];
    }
    for (h in Object.getOwnPropertyNames(this)) {
      typeof this[h] != "function" && (this[h] = null);
    }
  };
  c.prototype.update = function () {
    var m,
      h,
      f,
      g = this._core.clones().length / 2,
      o = g + this._core.items().length,
      p = this._core.maximum(true),
      n = this._core.settings,
      l = n.center || n.autoWidth || n.dotsData ? 1 : n.dotsEach || n.items;
    if (n.slideBy !== "page") {
      n.slideBy = Math.min(n.slideBy, n.items);
    }
    if (n.dots || n.slideBy == "page") {
      this._pages = [];
      for (m = g, h = 0, f = 0; m < o; m++) {
        if (h >= l || h === 0) {
          this._pages.push({ start: Math.min(p, m - g), end: m - g + l - 1 });
          if (Math.min(p, m - g) === p) {
            break;
          }
          (h = 0), ++f;
        }
        h += this._core.mergers(this._core.relative(m));
      }
    }
  };
  c.prototype.draw = function () {
    var j,
      i = this._core.settings,
      h = this._core.items().length <= i.items,
      g = this._core.relative(this._core.current()),
      f = i.loop || i.rewind;
    this._controls.$relative.toggleClass("disabled", !i.nav || h);
    if (i.nav) {
      this._controls.$previous.toggleClass(
        "disabled",
        !f && g <= this._core.minimum(true)
      );
      this._controls.$next.toggleClass(
        "disabled",
        !f && g >= this._core.maximum(true)
      );
    }
    this._controls.$absolute.toggleClass("disabled", !i.dots || h);
    if (i.dots) {
      j = this._pages.length - this._controls.$absolute.children().length;
      if (i.dotsData && j !== 0) {
        this._controls.$absolute.html(this._templates.join(""));
      } else {
        if (j > 0) {
          this._controls.$absolute.append(
            new Array(j + 1).join(this._templates[0])
          );
        } else {
          if (j < 0) {
            this._controls.$absolute.children().slice(j).remove();
          }
        }
      }
      this._controls.$absolute.find(".active").removeClass("active");
      this._controls.$absolute
        .children()
        .eq(d.inArray(this.current(), this._pages))
        .addClass("active");
    }
  };
  c.prototype.onTrigger = function (g) {
    var f = this._core.settings;
    g.page = {
      index: d.inArray(this.current(), this._pages),
      count: this._pages.length,
      size:
        f &&
        (f.center || f.autoWidth || f.dotsData ? 1 : f.dotsEach || f.items),
    };
  };
  c.prototype.current = function () {
    var f = this._core.relative(this._core.current());
    return d
      .grep(
        this._pages,
        d.proxy(function (h, g) {
          return h.start <= f && h.end >= f;
        }, this)
      )
      .pop();
  };
  c.prototype.getPosition = function (g) {
    var f,
      i,
      h = this._core.settings;
    if (h.slideBy == "page") {
      f = d.inArray(this.current(), this._pages);
      i = this._pages.length;
      g ? ++f : --f;
      f = this._pages[((f % i) + i) % i].start;
    } else {
      f = this._core.relative(this._core.current());
      i = this._core.items().length;
      g ? (f += h.slideBy) : (f -= h.slideBy);
    }
    return f;
  };
  c.prototype.next = function (f) {
    d.proxy(this._overrides.to, this._core)(this.getPosition(true), f);
  };
  c.prototype.prev = function (f) {
    d.proxy(this._overrides.to, this._core)(this.getPosition(false), f);
  };
  c.prototype.to = function (f, i, g) {
    var h;
    if (!g && this._pages.length) {
      h = this._pages.length;
      d.proxy(this._overrides.to, this._core)(
        this._pages[((f % h) + h) % h].start,
        i
      );
    } else {
      d.proxy(this._overrides.to, this._core)(f, i);
    }
  };
  d.fn.owlCarousel.Constructor.Plugins.Navigation = c;
})(window.Zepto || window.jQuery, window, document);
(function (d, c, a, e) {
  var b = function (f) {
    this._core = f;
    this._hashes = {};
    this.$element = this._core.$element;
    this._handlers = {
      "initialized.owl.carousel": d.proxy(function (g) {
        if (g.namespace && this._core.settings.startPosition === "URLHash") {
          d(c).trigger("hashchange.owl.navigation");
        }
      }, this),
      "prepared.owl.carousel": d.proxy(function (h) {
        if (h.namespace) {
          var g = d(h.content)
            .find("[data-hash]")
            .addBack("[data-hash]")
            .attr("data-hash");
          if (!g) {
            return;
          }
          this._hashes[g] = h.content;
        }
      }, this),
      "changed.owl.carousel": d.proxy(function (i) {
        if (i.namespace && i.property.name === "position") {
          var h = this._core.items(this._core.relative(this._core.current())),
            g = d
              .map(this._hashes, function (j, k) {
                return j === h ? k : null;
              })
              .join();
          if (!g || c.location.hash.slice(1) === g) {
            return;
          }
          c.location.hash = g;
        }
      }, this),
    };
    this._core.options = d.extend({}, b.Defaults, this._core.options);
    this.$element.on(this._handlers);
    d(c).on(
      "hashchange.owl.navigation",
      d.proxy(function (j) {
        var i = c.location.hash.substring(1),
          h = this._core.$stage.children(),
          g = this._hashes[i] && h.index(this._hashes[i]);
        if (g === e || g === this._core.current()) {
          return;
        }
        this._core.to(this._core.relative(g), false, true);
      }, this)
    );
  };
  b.Defaults = { URLhashListener: false };
  b.prototype.destroy = function () {
    var f, g;
    d(c).off("hashchange.owl.navigation");
    for (f in this._handlers) {
      this._core.$element.off(f, this._handlers[f]);
    }
    for (g in Object.getOwnPropertyNames(this)) {
      typeof this[g] != "function" && (this[g] = null);
    }
  };
  d.fn.owlCarousel.Constructor.Plugins.Hash = b;
})(window.Zepto || window.jQuery, window, document);
(function (e, g, i, d) {
  var b = e("<support>").get(0).style,
    f = "Webkit Moz O ms".split(" "),
    j = {
      transition: {
        end: {
          WebkitTransition: "webkitTransitionEnd",
          MozTransition: "transitionend",
          OTransition: "oTransitionEnd",
          transition: "transitionend",
        },
      },
      animation: {
        end: {
          WebkitAnimation: "webkitAnimationEnd",
          MozAnimation: "animationend",
          OAnimation: "oAnimationEnd",
          animation: "animationend",
        },
      },
    },
    c = {
      csstransforms: function () {
        return !!h("transform");
      },
      csstransforms3d: function () {
        return !!h("perspective");
      },
      csstransitions: function () {
        return !!h("transition");
      },
      cssanimations: function () {
        return !!h("animation");
      },
    };
  function h(n, l) {
    var k = false,
      m = n.charAt(0).toUpperCase() + n.slice(1);
    e.each((n + " " + f.join(m + " ") + m).split(" "), function (o, p) {
      if (b[p] !== d) {
        k = l ? p : true;
        return false;
      }
    });
    return k;
  }
  function a(k) {
    return h(k, true);
  }
  if (c.csstransitions()) {
    e.support.transition = new String(a("transition"));
    e.support.transition.end = j.transition.end[e.support.transition];
  }
  if (c.cssanimations()) {
    e.support.animation = new String(a("animation"));
    e.support.animation.end = j.animation.end[e.support.animation];
  }
  if (c.csstransforms()) {
    e.support.transform = new String(a("transform"));
    e.support.transform3d = c.csstransforms3d();
  }
})(window.Zepto || window.jQuery, window, document);
