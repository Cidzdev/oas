/**
 * GGraphs
 * Javascript HTML5 graphs
 *
 * @filesource js/ggraph.js
 * @link https://www.kotchasan.com/
 * @copyright 2016 Goragod.com
 * @license https://www.kotchasan.com/license/
 */
(function() {
  "use strict";
  window.GGraphs = GClass.create();
  GGraphs.prototype = {
    initialize: function(id, o) {
      this.graphs = $G(id);
      this.graphs.addClass("ggraphs");
      this.graphs.setStyle("padding", 0);
      this.canvas = $G(this.graphs.getElementsByTagName("canvas")[0]);
      this.hoverItem = null;
      this.options = {
        type: "line",
        rows: 5,
        colors: [
          "#438AEF",
          "#FBB242",
          "#DE4210",
          "#259B24",
          "#E91E63",
          "#1F3D68",
          "#FEE280",
          "#1A9ADC",
          "#C86A4C",
          "#055CDA",
          "#F2D086",
          "#51627F",
          "#F0B7A6",
          "#DE8210",
          "#7791BC"
        ],
        startColor: 0,
        backgroundColor: "auto",
        shadowColor: "rgba(0,0,0,0.3)",
        fontColor: "auto",
        gridHColor: "#CDCDCD",
        gridVColor: "#CDCDCD",
        showTitle: true,
        lineWidth: 2,
        linePointerSize: 3,
        centerOffset: null,
        centerX: null,
        centerY: null,
        labelOffset: null,
        ringWidth: 30,
        rotate: false,
        strokeColor: "#000000"
      };
      for (var property in o) {
        this.options[property] = o[property];
      }
      this.context = this.canvas.getContext("2d");
      var self = this,
        options = this.options;
      if (options.startColor > 0) {
        var temp = [],
          l = options.colors.length,
          i = Math.max(0, Math.min(l - 1, options.startColor));
        for (var a = 0; a < l; a++) {
          temp.push(options.colors[i]);
          i = i < l - 1 ? i + 1 : 0;
        }
        options.colors = temp;
      }
      this.datas = {};
      var datas = [],
        ths = this.graphs.getElementsByTagName("thead")[0].getElementsByTagName("th");
      forEach(ths, function(item, index) {
        if (index > 0) {
          datas.push(item.innerHTML.strip_tags());
        }
      });
      this.subtitle = this.graphs
        .getElementsByTagName("thead")[0]
        .getElementsByTagName("th")[0]
        .innerHTML.strip_tags()
        .trim();
      this.subtitle = this.subtitle == "" ? "" : this.subtitle + " ";
      this.datas.labels = datas;
      this.max = 0;
      this.min = null;
      var rows = [],
        trs = this.graphs.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
      forEach(trs, function() {
        var val,
          datas = new Array(),
          d = {},
          max = 0,
          min = null,
          sum = 0;
        forEach(this.getElementsByTagName("td"), function() {
          val = {};
          if (this.dataset.value) {
            val.value = floatval(this.dataset.value);
          } else {
            val.value = floatval(this.innerHTML.replace(/,/g, ""));
          }
          val.title = this.innerHTML.strip_tags();
          if (this.dataset.tooltip) {
            val.tooltip = this.dataset.tooltip;
          }
          sum = sum + val.value;
          max = Math.max(max, val.value);
          min = min == null ? val.value : Math.min(min, val.value);
          datas.push(val);
        });
        d.title = this.getElementsByTagName("th")[0].innerHTML.strip_tags();
        d.items = datas;
        d.total = sum;
        d.max = max;
        d.min = min;
        rows.push(d);
        self.max = Math.max(max, self.max);
        self.min = self.min == null ? min : Math.min(min, self.min);
      });
      let range = this.max - this.min,
        rowHeight = Math.ceil(range / this.options.rows),
        p = 1;
      while (Math.ceil(rowHeight / p) * p <= rowHeight) {
        p = p * 10;
      }
      if (p < rowHeight) {
        rowHeight = Math.ceil(rowHeight / p) * p;
      }
      this.min = (Math.floor(this.min / p) * p) - rowHeight;
      this.max = this.min + (rowHeight * (this.options.rows + 2));
      this.datas.rows = rows;
      var _mouseMove = function(e) {
        var currItem = null,
          offset = self.canvas.viewportOffset(),
          pos = GEvent.pointer(e),
          mouseX = pos.x - offset.left,
          mouseY = pos.y - offset.top,
          tootip = [],
          _tooltip;
        forEach(self.datas.rows, function(rows, row) {
          forEach(this.items, function(item, index) {
            if (
              mouseX >= item.x &&
              mouseX <= item.w &&
              mouseY >= item.y &&
              mouseY <= item.h
            ) {
              currItem = item;
              if (item.tooltip) {
                _tooltip = item.tooltip.replace(/[\n]{1,}/g, ' ');
              } else {
                _tooltip = self.subtitle + self.datas.labels[index] + ' ' + rows.title + " " + item.title;
              }
              if (tootip.length == 0 || tootip[0] != _tooltip) {
                tootip.push(_tooltip);
              }
              return true;
            }
          });
        });
        if (!currItem) {
          if (self.hoverItem) {
            self.canvas.style.cursor = "default";
            self.tooltip.hide();
            self.hoverItem = null;
          }
        } else if (self.hoverItem !== currItem) {
          self.canvas.style.cursor = "pointer";
          self.hoverItem = currItem;
          self.tooltip.innerHTML = tootip.join('<br>');
          var rc = self.tooltip.getDimensions(),
            l = pos.x - 20;
          if (l > document.viewport.getWidth() / 2) {
            l = pos.x - rc.width + 20;
            self.tooltip.className = "tooltip-bottom-right";
          } else {
            self.tooltip.className = "tooltip-bottom-left";
          }
          self.tooltip.style.left = l + "px";
          self.tooltip.style.top = pos.y - 16 - rc.height + "px";
          self.tooltip.fadeIn();
          self.tooltip.show();
        }
      };
      this.loading = true;
      var transparent = /rgba\([0-9a-fA-F,\s]+0\)/,
        _change = function() {
          var val,
            changed = false;
          val = self.getFontSize();
          if (val != self.fontSize) {
            self.fontSize = val;
            changed = true;
          }
          val = self.graphs.getStyle("color");
          if (val != self.fontColor) {
            self.fontColor = val;
            changed = true;
          }
          val = self.graphs.getStyle("backgroundColor");
          if (val == "transparent" || transparent.test(val)) {
            val = $G(document.body).getStyle("backgroundColor");
          }
          if (val != self.backgroundColor) {
            self.backgroundColor = val;
            changed = true;
          }
          val = self.canvas.getWidth();
          if (val != self.width) {
            self.width = val;
            changed = true;
          }
          val = self.canvas.getHeight();
          if (val != self.height) {
            self.height = val;
            changed = true;
          }
          if (changed) {
            try {
              if (options.type == "line") {
                self.drawLine(false);
              } else if (options.type == "spline") {
                self.drawLine(true);
              } else if (options.type == "pie") {
                self.drawPie();
              } else if (options.type == "donut") {
                self.drawDonut();
              } else if (options.type == "hchart") {
                self.drawHChart();
              } else {
                self.drawVChart();
              }
            } catch (err) {}
          }
          if (self.loading) {
            if (options.type !== "pie" && options.type !== "donut") {
              self.canvas.addEvent("mousemove", _mouseMove);
            }
            self.loading = false;
          }
        };
      window.addEventListener('resize', _change, true);
      _change();
      if ($E("ggraph_tooltip")) {
        this.tooltip = $G("ggraph_tooltip");
      } else {
        this.tooltip = $G(document.createElement("div"));
        document.body.appendChild(this.tooltip);
        this.tooltip.className = "tooltip-bottom";
        this.tooltip.id = "ggraph_tooltip";
        this.tooltip.hide();
        $G(document.body).addEvent("click", function() {
          self.tooltip.hide();
        });
      }
    },
    drawLine: function(spline) {
      this.clear();
      var options = this.options,
        self = this,
        context = this.context,
        offsetRight = Math.ceil(context.measureText(this.datas.labels[this.datas.labels.length - 1]).width / 2),
        rowHeight = (this.max - this.min) / options.rows,
        label = this.max;
      var l = 0;
      for (var i = 0; i < options.rows; i++) {
        l = Math.max(l, context.measureText(label).width);
        label = label - rowHeight;
      }
      l = l + 15;
      var t = Math.ceil(this.fontSize / 2),
        r = this.width - offsetRight - 5,
        b = this.height - this.fontSize - (options.labelOffset || 5),
        rows = options.rows,
        cols = Math.max(2, this.datas.labels.length);
      var cellWidth = Math.floor((r - l) / (cols - 1)),
        cellHeight = Math.floor((b - t) / rows);
      r = cellWidth * (cols - 1) + l;
      b = cellHeight * rows + t;
      var clientHeight = b - t,
        o = options.lineWidth + 2;
      forEach(this.datas.rows, function() {
        forEach(this.items, function(item, index) {
          item.cx = index * cellWidth + l;
          item.cy = clientHeight + t - Math.floor((clientHeight * (item.value - self.min)) / (self.max - self.min));
          item.x = item.cx - o;
          item.y = item.cy - o;
          item.w = item.cx + o;
          item.h = item.cy + o;
        });
      });

      function drawGraph() {
        var y = t;
        context.lineWidth = 1;
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillStyle = self.fontColor;
        var label = self.max;
        for (var i = 0; i <= rows; i++) {
          context.fillText(toCurrency(label, null, true), l - 10, y);
          if (options.gridVColor && i > 0 && i < rows) {
            context.strokeStyle = options.gridVColor;
            context.beginPath();
            context.moveTo(l, y);
            context.lineTo(r, y);
            context.stroke();
            context.closePath();
          }
          y = y + cellHeight;
          label = label - rowHeight;
        }
        var x = l;
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillStyle = self.fontColor;
        forEach(self.datas.labels, function(item, index) {
          if (options.gridHColor && index > 0 && index < cols - 1) {
            context.strokeStyle = options.gridHColor;
            context.beginPath();
            context.moveTo(x, t);
            context.lineTo(x, b);
            context.stroke();
            context.closePath();
          }
          if (options.rotate) {
            var metric = context.measureText(item);
            var y = self.height - metric.width + 35;
            var xx = x + self.fontSize / 2;
            context.save();
            context.translate(xx, y);
            context.rotate(-Math.PI / 2);
            context.translate(-xx, -y);
            context.fillText(item, xx, y);
            context.restore();
          } else {
            context.fillText(item, x, self.height);
          }
          x = x + cellWidth;
        });
        context.strokeStyle = self.fontColor;
        context.beginPath();
        context.moveTo(l, t);
        context.lineTo(r, t);
        context.lineTo(r, b);
        context.lineTo(l, b);
        context.lineTo(l, t);
        context.stroke();
        context.closePath();
        var xp, yp, len;
        if (spline) {
          var line = new Spline(self.canvas, {
            minWidth: options.lineWidth / 2,
            maxWidth: options.lineWidth / 2
          });
        }
        context.lineWidth = Math.max(1, options.lineWidth);
        forEach(self.datas.rows, function(rows, row) {
          if (spline) {
            line.penColor = options.colors[row % options.colors.length];
            line.reset();
            len = rows.items.length;
          }
          forEach(rows.items, function(item, index) {
            if (spline) {
              line.add(item.cx, item.cy);
              if (index == len - 1) {
                line.add(xp, yp);
              }
            } else if (index > 0) {
              context.strokeStyle = options.colors[row % options.colors.length];
              context.beginPath();
              context.moveTo(xp, yp);
              context.lineTo(item.cx, item.cy);
              context.stroke();
              context.closePath();
            }
            xp = item.cx;
            yp = item.cy;
          });
          if (options.linePointerSize > 0) {
            forEach(rows.items, function() {
              context.fillStyle = options.colors[row % options.colors.length];
              context.beginPath();
              context.arc(this.cx, this.cy, options.linePointerSize, 0, Math.PI * 2, true);
              context.fill();
            });
          }
        });
        self.drawBottomLabel(self.datas.rows, options);
      }
      drawGraph();
    },
    drawPie: function() {
      this.clear();
      var options = this.options,
        self = this,
        context = this.context,
        centerX = options.centerX == null ? Math.round(this.width / 2) : options.centerX,
        centerY = options.centerY == null ? Math.round(this.height / 2) : options.centerY,
        radius = centerY - (options.centerOffset || (this.height * 0.15)),
        counter = 0.0,
        chartStartAngle = -0.5 * Math.PI,
        sum = this.datas.rows[0].total,
        labelOffset = options.labelOffset || (this.height * 0.15);
      forEach(this.datas.rows[0].items, function(item, index) {
        var fraction = item.value / sum;
        item.startAngle = counter * Math.PI * 2;
        item.endAngle = (counter + fraction) * Math.PI * 2;
        item.midAngle = counter + fraction / 2;
        item.percentage = Math.round(fraction * 100);
        counter += fraction;
      });

      function drawSlice(slice, index) {
        if (slice.percentage) {
          var distance = (radius / 2.5) * (Math.pow(1 - 2.5 / radius, 0.8) + 1) + labelOffset,
            labelX = Math.round(centerX + Math.sin(slice.midAngle * Math.PI * 2) * distance),
            labelY = Math.round(centerY - Math.cos(slice.midAngle * Math.PI * 2) * distance),
            c = options.colors[index % options.colors.length];
          context.strokeStyle = c;
          context.beginPath();
          context.moveTo(centerX, centerY);
          context.lineTo(labelX, labelY);
          if (labelX < centerX) {
            context.lineTo(labelX - 5, labelY);
            context.textAlign = "right";
            labelX -= 10;
          } else {
            context.lineTo(labelX + 5, labelY);
            context.textAlign = "left";
            labelX += 10;
          }
          context.textBaseline = "middle";
          context.stroke();
          context.closePath();
          context.fillStyle = c;
          var text = toCurrency(slice.value, null, true);
          if (options.strokeColor) {
            context.strokeStyle = options.strokeColor;
            context.strokeText(text, labelX, labelY);
          }
          context.fillText(text, labelX, labelY);
        }
        var startAngle = slice.startAngle + chartStartAngle,
          endAngle = slice.endAngle + chartStartAngle;
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, radius, startAngle, endAngle, false);
        context.lineTo(centerX, centerY);
        context.closePath();
        context.fillStyle = options.colors[index % options.colors.length];
        context.fill();
        context.lineWidth = 0;
        context.strokeStyle = self.backgroundColor;
        context.stroke();
      }

      function drawGraph() {
        context.save();
        context.fillStyle = self.backgroundColor;
        context.beginPath();
        context.arc(centerX, centerY, radius + 2, 0, Math.PI * 2, false);
        context.fill();
        context.restore();
        forEach(self.datas.rows[0].items, function(item, index) {
          drawSlice(item, index);
        });
        self.drawBottomLabel(self.datas.labels, options);
      }
      drawGraph();
      var _mouseMove = function(e) {
        var currItem = null,
          offset = self.canvas.viewportOffset(),
          pos = GEvent.pointer(e),
          mouseX = pos.x - offset.left,
          mouseY = pos.y - offset.top,
          xFromCenter = mouseX - centerX,
          yFromCenter = mouseY - centerY,
          distanceFromCenter = Math.sqrt(Math.pow(Math.abs(xFromCenter), 2) + Math.pow(Math.abs(yFromCenter), 2));
        if (distanceFromCenter <= radius) {
          var mouseAngle = Math.atan2(yFromCenter, xFromCenter) - chartStartAngle;
          if (mouseAngle < 0) {
            mouseAngle = 2 * Math.PI + mouseAngle;
          }
          forEach(self.datas.rows[0].items, function(item, index) {
            if (mouseAngle >= item.startAngle && mouseAngle <= item.endAngle) {
              currItem = item;
              if (item.tooltip) {
                self.tooltip.innerHTML = item.tooltip;
              } else {
                self.tooltip.innerHTML = self.subtitle + self.datas.labels[index] + "<br>" + self.datas.rows[0].title + " " + item.title;
              }
              var rc = self.tooltip.getDimensions(),
                l = pos.x - 20;
              if (l > document.viewport.getWidth() / 2) {
                l = pos.x - rc.width + 20;
                self.tooltip.className = "tooltip-bottom-right";
              } else {
                self.tooltip.className = "tooltip-bottom-left";
              }
              self.tooltip.style.left = l + "px";
              self.tooltip.style.top = pos.y - 16 - rc.height + "px";
              return true;
            }
          });
        }
        if (!currItem) {
          if (self.hoverItem) {
            self.canvas.style.cursor = "default";
            self.tooltip.hide();
            self.hoverItem = null;
          }
        } else if (self.hoverItem !== currItem) {
          self.canvas.style.cursor = "pointer";
          self.hoverItem = currItem;
          self.tooltip.fadeIn();
          self.tooltip.show();
        }
      };
      if (this.loading) {
        this.canvas.addEvent("mousemove", _mouseMove);
      }
    },
    drawDonut: function() {
      this.clear();
      var options = this.options,
        self = this,
        context = this.context,
        centerX = options.centerX == null ? Math.round(this.width / 2) : options.centerX,
        centerY = options.centerY == null ? Math.round(this.height / 2) : options.centerY,
        radius = centerY - (options.centerOffset || (this.height * 0.15)),
        counter = 0.0,
        chartStartAngle = -0.5 * Math.PI,
        sum = this.datas.rows[0].total,
        labelOffset = options.labelOffset || (this.height * 0.15);
      forEach(this.datas.rows[0].items, function(item, index) {
        var fraction = item.value / sum;
        item.startAngle = counter * Math.PI * 2;
        item.endAngle = (counter + fraction) * Math.PI * 2;
        item.midAngle = counter + fraction / 2;
        item.percentage = Math.round(fraction * 100);
        counter += fraction;
      });

      function drawSlice(slice, index) {
        if (slice.percentage) {
          var distance = (radius / 2.5) * (Math.pow(1 - 2.5 / radius, 0.8) + 1) + labelOffset,
            labelX = Math.round(centerX + Math.sin(slice.midAngle * Math.PI * 2) * distance),
            labelY = Math.round(centerY - Math.cos(slice.midAngle * Math.PI * 2) * distance),
            c = options.colors[index % options.colors.length];
          context.strokeStyle = c;
          context.beginPath();
          context.moveTo(centerX, centerY);
          context.lineTo(labelX, labelY);
          if (labelX < centerX) {
            context.lineTo(labelX - 5, labelY);
            context.textAlign = "right";
            labelX -= 10;
          } else {
            context.lineTo(labelX + 5, labelY);
            context.textAlign = "left";
            labelX += 10;
          }
          context.textBaseline = "middle";
          context.stroke();
          context.closePath();
          context.fillStyle = c;
          var text = toCurrency(slice.value, null, true);
          if (options.strokeColor) {
            context.strokeStyle = options.strokeColor;
            context.strokeText(text, labelX, labelY);
          }
          context.fillText(text, labelX, labelY);
        }
        var startAngle = slice.startAngle + chartStartAngle,
          endAngle = slice.endAngle + chartStartAngle;
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, radius, startAngle, endAngle, false);
        context.lineTo(centerX, centerY);
        context.closePath();
        context.fillStyle = options.colors[index % options.colors.length];
        context.fill();
        context.lineWidth = 0;
        context.strokeStyle = self.backgroundColor;
        context.stroke();
      }

      function drawGraph() {
        context.save();
        context.fillStyle = self.backgroundColor;
        context.beginPath();
        context.arc(centerX, centerY, radius + 2, 0, Math.PI * 2, false);
        context.fill();
        forEach(self.datas.rows[0].items, function(item, index) {
          drawSlice(item, index);
        });
        context.fillStyle = self.backgroundColor;
        context.beginPath();
        context.arc(centerX, centerY, radius - options.ringWidth, 0, Math.PI * 2, false);
        context.fill();
        context.restore();
        self.drawBottomLabel(self.datas.labels, options);
      }
      drawGraph();
      var _mouseMove = function(e) {
        var currItem = null,
          offset = self.canvas.viewportOffset(),
          pos = GEvent.pointer(e),
          mouseX = pos.x - offset.left,
          mouseY = pos.y - offset.top,
          xFromCenter = mouseX - centerX,
          yFromCenter = mouseY - centerY,
          distanceFromCenter = Math.sqrt(Math.pow(Math.abs(xFromCenter), 2) + Math.pow(Math.abs(yFromCenter), 2));
        if (
          distanceFromCenter <= radius &&
          distanceFromCenter > radius - options.ringWidth
        ) {
          var mouseAngle = Math.atan2(yFromCenter, xFromCenter) - chartStartAngle;
          if (mouseAngle < 0) {
            mouseAngle = 2 * Math.PI + mouseAngle;
          }
          forEach(self.datas.rows[0].items, function(item, index) {
            if (mouseAngle >= item.startAngle && mouseAngle <= item.endAngle) {
              currItem = item;
              if (item.tooltip) {
                self.tooltip.innerHTML = item.tooltip;
              } else {
                self.tooltip.innerHTML =
                  self.subtitle +
                  self.datas.labels[index] +
                  "<br>" +
                  self.datas.rows[0].title +
                  " " +
                  item.title;
              }
              var rc = self.tooltip.getDimensions(),
                l = pos.x - 20;
              if (l > document.viewport.getWidth() / 2) {
                l = pos.x - rc.width + 20;
                self.tooltip.className = "tooltip-bottom-right";
              } else {
                self.tooltip.className = "tooltip-bottom-left";
              }
              self.tooltip.style.left = l + "px";
              self.tooltip.style.top = pos.y - 16 - rc.height + "px";
              return true;
            }
          });
        }
        if (!currItem) {
          if (self.hoverItem) {
            self.canvas.style.cursor = "default";
            self.tooltip.hide();
            self.hoverItem = null;
          }
        } else if (self.hoverItem !== currItem) {
          self.canvas.style.cursor = "pointer";
          self.hoverItem = currItem;
          self.tooltip.fadeIn();
          self.tooltip.show();
        }
      };
      if (this.loading) {
        this.canvas.addEvent("mousemove", _mouseMove);
      }
    },
    drawHChart: function() {
      this.clear();
      var options = this.options,
        self = this,
        context = this.context,
        offsetRight = Math.ceil(context.measureText(toCurrency(this.max, null, true)).width / 2),
        l = 0;
      forEach(this.datas.labels, function() {
        l = Math.max(l, self.context.measureText(this).width);
      });
      l = l + 10;
      var t = Math.ceil(this.fontSize / 2),
        r = this.width - offsetRight,
        b = this.height - this.fontSize - (options.labelOffset || 5),
        cols = options.rows,
        rows = Math.max(2, this.datas.labels.length);
      var cellWidth = Math.floor((r - l) / cols),
        cellHeight = Math.floor((b - t) / rows);
      r = cellWidth * cols + l;
      b = cellHeight * rows + t;
      var clientWidth = r - l,
        barHeight = Math.max(2, (cellHeight - 8 - 2 * (this.datas.rows.length + 1)) / this.datas.rows.length),
        offsetHeight = t + 6;
      forEach(self.datas.rows, function() {
        forEach(this.items, function(item, index) {
          item.x = l;
          item.y = index * cellHeight + offsetHeight;
          item.cw = Math.max(3, Math.floor((clientWidth * item.value) / self.max));
          item.ch = barHeight;
          item.w = item.x + item.cw;
          item.h = item.y + barHeight;
        });
        offsetHeight = offsetHeight + barHeight + 2;
      });

      function drawGraph() {
        var y = t;
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillStyle = self.fontColor;
        var offset = cellHeight / 2;
        forEach(self.datas.labels, function(item, index) {
          context.fillText(item, 0, y + offset);
          if (options.gridVColor && index > 0 && index < rows) {
            context.strokeStyle = options.gridVColor;
            context.beginPath();
            context.moveTo(l, y);
            context.lineTo(r, y);
            context.stroke();
            context.closePath();
          }
          y = y + cellHeight;
        });
        var label = 0,
          labelValue = self.max / cols,
          x = l;
        if (labelValue > 1) {
          labelValue = Math.floor(labelValue);
        }
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillStyle = self.fontColor;
        for (var i = 0; i <= cols; i++) {
          if (i > 0) {
            if (options.rotate) {
              var metric = context.measureText(label),
                y = self.height - metric.width,
                xx = x + self.fontSize / 2;
              context.save();
              context.translate(xx, y);
              context.rotate(-Math.PI / 2);
              context.translate(-xx, -y);
              context.fillText(toCurrency(label, null, true), xx, y);
              context.restore();
            } else {
              context.fillText(toCurrency(label, null, true), x, self.height);
            }
          }
          if (options.gridHColor && i > 0 && i < cols) {
            context.strokeStyle = options.gridHColor;
            context.beginPath();
            context.moveTo(x, t);
            context.lineTo(x, b);
            context.stroke();
            context.closePath();
          }
          x = x + cellWidth;
          label = label + labelValue;
        }
        context.strokeStyle = self.fontColor;
        context.beginPath();
        context.moveTo(l, t);
        context.lineTo(r, t);
        context.lineTo(r, b);
        context.lineTo(l, b);
        context.lineTo(l, t);
        context.stroke();
        context.closePath();
        var sw = barHeight < 10 ? 1 : 3;
        var dl = self.datas.rows.length;
        forEach(self.datas.rows, function(rows, row) {
          forEach(this.items, function(item, index) {
            if (item.cw > sw && item.value > 0) {
              context.fillStyle = options.shadowColor;
              context.fillRect(item.x, item.y, item.cw - sw, item.ch);
            }
            context.fillStyle = options.colors[(dl > 1 ? row : index) % options.colors.length];
            context.fillRect(item.x + 1, item.y, item.cw, item.ch - sw);
          });
        });
        self.drawBottomLabel(self.datas.rows, options);
      }
      drawGraph();
    },
    drawVChart: function() {
      this.clear();
      var options = this.options,
        l = 0,
        self = this,
        context = this.context,
        offsetRight = Math.ceil(context.measureText(this.datas.labels[this.datas.labels.length - 1]).width / 2),
        label = this.max,
        labelValue = this.max / options.rows;
      if (labelValue > 1) {
        labelValue = Math.floor(labelValue);
      }
      for (var i = 0; i < options.rows; i++) {
        l = Math.max(l, context.measureText(label).width);
        label = label - labelValue;
      }
      l = l + 15;
      var t = Math.ceil(this.fontSize / 2),
        r = this.width - offsetRight,
        b = this.height - this.fontSize - (options.labelOffset || 5),
        cols = Math.max(2, this.datas.labels.length);
      var cellWidth = (r - l) / cols,
        cellHeight = (b - t) / options.rows,
        offsetWidth = l + 6,
        barWidth = Math.max(2, (cellWidth - 6 * (this.datas.rows.length + 1)) / this.datas.rows.length),
        clientHeight = cellHeight * options.rows;
      forEach(self.datas.rows, function() {
        forEach(this.items, function(item, index) {
          item.x = index * cellWidth + offsetWidth;
          item.y = clientHeight - ((clientHeight * item.value) / self.max) + t;
          item.ch = b - item.y;
          item.cw = barWidth;
          item.w = item.x + item.cw;
          item.h = b;
          if (item.ch < 3) {
            item.y = b - 3;
            item.ch = 3;
          }
        });
        offsetWidth = offsetWidth + barWidth + 2;
      });

      function drawGraph() {
        var y = t;
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillStyle = self.fontColor;
        var label = self.max,
          labelValue = self.max / options.rows;
        if (labelValue > 1) {
          labelValue = Math.floor(labelValue);
        }
        for (var i = 0; i <= options.rows; i++) {
          if (i < options.rows) {
            context.fillText(toCurrency(label, null, true), l - 5, y);
          }
          if (options.gridVColor && i > 0 && i < options.rows) {
            context.strokeStyle = options.gridVColor;
            context.beginPath();
            context.moveTo(l, y);
            context.lineTo(r, y);
            context.stroke();
            context.closePath();
          }
          y = y + cellHeight;
          label = label - labelValue;
        }
        var x = l,
          offset = cellWidth / 2;
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillStyle = self.fontColor;
        forEach(self.datas.labels, function(item, index) {
          if (index < cols) {
            if (options.rotate) {
              var metric = context.measureText(item),
                y = self.height - metric.width + 35,
                xx = x + offset + (self.fontSize / 2);
              context.save();
              context.translate(xx, y);
              context.rotate(-Math.PI / 2);
              context.translate(-xx, -y);
              context.fillText(item, xx, y);
              context.restore();
            } else {
              context.fillText(item, x + offset, self.height);
            }
          }
          if (options.gridHColor && index > 0 && index < cols) {
            context.strokeStyle = options.gridHColor;
            context.beginPath();
            context.moveTo(x, t);
            context.lineTo(x, b);
            context.stroke();
            context.closePath();
          }
          x = x + cellWidth;
        });
        context.strokeStyle = self.fontColor;
        context.beginPath();
        context.moveTo(l, t);
        context.lineTo(r, t);
        context.lineTo(r, b);
        context.lineTo(l, b);
        context.lineTo(l, t);
        context.stroke();
        context.closePath();
        var sw = barWidth < 10 ? 1 : 3,
          dl = self.datas.rows.length;
        forEach(self.datas.rows, function(rows, row) {
          forEach(this.items, function(item, index) {
            if (item.ch > sw && item.value > 0) {
              context.fillStyle = options.shadowColor;
              context.fillRect(item.x, item.y + sw, item.cw, item.ch - sw);
            }
            context.fillStyle = options.colors[(dl > 1 ? row : index) % options.colors.length];
            context.fillRect(item.x, item.y, item.cw - sw, item.ch - 1);
          });
        });
        self.drawBottomLabel(self.datas.rows, options);
      }
      drawGraph();
    },
    clear: function() {
      this.canvas.set("width", this.width);
      this.canvas.set("height", this.height);
      this.context.font = this.fontSize + "px " + this.graphs.getStyle("fontFamily");
      this.context.fillStyle = this.backgroundColor;
      this.context.fillRect(0, 0, this.width, this.height);
    },
    drawBottomLabel: function(labels, options) {
      if (options.showTitle) {
        let label,
          div,
          span,
          graph = this.canvas.parentNode,
          lbs = graph.getElementsByClassName('bottom_label');
        if (lbs.length == 0) {
          div = document.createElement('div');
          graph.insertBefore(div, this.canvas.nextSibling);
          div.className = 'bottom_label';
        } else {
          div = lbs[0];
          div.innerHTML = '';
        }
        forEach(labels, function(item, index) {
          label = document.createElement('div');
          span = document.createElement('span');
          span.style.backgroundColor = options.colors[index % options.colors.length];
          label.appendChild(span);
          span = document.createElement('span');
          span.innerHTML = item.title ? item.title : item;
          label.appendChild(span);
          div.appendChild(label);
        });
      }
    },
    getFontSize: function() {
      var div = document.createElement("div"),
        atts = {
          fontSize: "1em",
          padding: "0",
          position: "absolute",
          lineHeight: "1",
          visibility: "hidden"
        };
      for (var p in atts) {
        div.style[p] = atts[p];
      }
      div.appendChild(document.createTextNode("M"));
      this.graphs.appendChild(div);
      var h = div.offsetHeight;
      this.graphs.removeChild(div);
      return h;
    }
  };
})();
