import { Observable } from 'rxjs/Observable';
import { TextCanvas } from '../../canvas/text-canvas';
import { TextShapeType } from './text-shape-type';
import { Outline } from '../outline';
import { OutlineTwo } from '../outline-two';
import { DropShadow } from '../drop-shadow';

export class Arch extends TextShapeType {
  public name = 'arch';
  
  protected createShape(): Observable<TextCanvas> {
    return Observable.create((observer) => {
      this.getPlainTextCanvas().subscribe((textCanvas) => {
        const canvas = textCanvas.canvas;
        const context = canvas.getContext("2d");
        const angleInRadians = angleInDegrees => (angleInDegrees) * (Math.PI / 180.0);

        var angle = Math.abs( (this.element.shapeAdjust - 50) * 3.6 );
        angle = angle === 360.0 ? 359 : angle;
        const clockwise = this.element.shapeAdjust - 50 > 0 ? 1 : 0;
        
        const getBinary = (file) => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", file, false);
          xhr.overrideMimeType("text/plain; charset=x-user-defined");
          xhr.send(null);
          return xhr.responseText;
        }
        
        // Base64 encode binary string
        const base64Encode = (str) => {
          var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          var out = "", i = 0, len = str.length, c1, c2, c3;
          while (i < len) {
            c1 = str.charCodeAt(i++) & 0xff;
            if (i == len) {
              out += CHARS.charAt(c1 >> 2);
              out += CHARS.charAt((c1 & 0x3) << 4);
              out += "==";
              break;
            }
            c2 = str.charCodeAt(i++);
            if (i == len) {
              out += CHARS.charAt(c1 >> 2);
              out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
              out += CHARS.charAt((c2 & 0xF) << 2);
              out += "=";
              break;
            }
            c3 = str.charCodeAt(i++);
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
            out += CHARS.charAt(c3 & 0x3F);
          }
          return out;
        }

        //get Arch path
        const arch = (x, y, fontSize, fontFamily, text, angle, clockwise) => {
          const fullCircle = angle === 360;
          const rad = angleInRadians(angle);
          
          context.font = fontSize + 'px ' + fontFamily;
          const dist = context.measureText(text).width + text.length * this.element.letterSpacing;

          if (angle === 0) {
            return [
              'M', x, y,
              'L', x + dist, y
            ].join(' ')
          }

          const r = dist / rad;
          const lengthBow = 2 * r * Math.sin(rad / 2)
          return [
            'M', x, y,
            'A', r, r, 0, angle > 180 ? 1 : 0, clockwise, x + lengthBow, y, (fullCircle) ? 'z' : null
          ].join(' ');
        }

        //get exact size of transformed text
        const getSize = (fontSize, fontFamily, text, angle, clockwise) => {
          const rad = angleInRadians(angle);
          context.font = fontSize + 'px ' + fontFamily;
          const dist = context.measureText(text).width + text.length * this.element.letterSpacing;

          if (angle === 0) {
            return {
              w: dist,
              h: fontSize,
              d: 9999999999
            }
          }

          const r = dist / rad;
          const lengthBow = 2 * r * Math.sin(rad / 2)
          var R = r;
          if (clockwise) {
            R = r + fontSize;
          }

          if (angle >= 180) {
            return {
              d: lengthBow,
              w: 2 * R,
              h: R * (1 + Math.cos( angleInRadians(180 - angle / 2.0) ) )
            }
          } else {
            return {
              d: lengthBow,
              w: Math.cos( angleInRadians(90 - angle / 2.0) ) * R * 2,
              h: R - (R - fontSize) * Math.cos( angleInRadians(angle / 2) )
            }
          }
        }

        const fontSize = 2 * this.element.area.side.pixelsPerInch;
        // get outline and dropshadow info
        const outline = this.element.getEffect("Outline") as Outline;
        const outlineTwo = this.element.getEffect("OutlineTwo") as OutlineTwo;
        const text = document.createElementNS('http://www.w3.org/2000/svg','text');
        const dropShadow = this.element.getEffect("DropShadow") as DropShadow;
        //clear original text canvas
        textCanvas.context.clearRect(0, 0, textCanvas.canvas.width, textCanvas.canvas.height);

        //font setting
        const font_name = this.font.family;
        const font_format = 'woff2'; // best compression
        const font_mimetype = 'font/' + font_format;
        const base64EncodedFont = base64Encode(getBinary(this.font.url));
        const font_data = 'data:'+font_mimetype+';charset=ascii;base64,' + base64EncodedFont;
        const newStyle = document.createElement('style');
        newStyle.setAttribute('type', 'text/css');  
        newStyle.appendChild(document.createTextNode(
          "@font-face {" +
          "  font-family: '"+font_name+"';" +
          "  src: url('"+font_data+"')" +
          "    format('"+font_format+"')" +
          "  ;" +
          "}"
        ))

        const clipartClone = document.createElementNS('http://www.w3.org/2000/svg','svg');

        // add style
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.appendChild(newStyle);
        clipartClone.appendChild(defs);
        // Make transformed text as svg
        // maximum width and length of line of bow for all text
        var w = 0;
        var h = 0;
        var d = 0;
        var defaultLinespacing = 67.482;
        this.text.split(/\n/).forEach((line, i) => {
          const dim = getSize(fontSize, this.font.family, line, angle, clockwise);
          if (!line.replace(/\s/g, '').length) {
            return;
          }
          if (dim.w > w) {
            w = dim.w;
            d = dim.d;
          }
        });
        
        this.text.split(/\n/).forEach((line, i) => {
          const dim = getSize(fontSize, this.font.family, line, angle, clockwise);
          // space and line breaking is ignored.
          if (!line.replace(/\s/g, '').length) {
            return;
          }
          // line height is considered.
          h += (dim.h + this.element.lineSpacing - defaultLinespacing);
          // get exact path of this text. 
          // h + 100 is to avoiding hiding outline.
          // w + (d - dim.d) / 2 center all texts with line breaking.
          const dd = arch(w + (d - dim.d) / 2, h + 100, fontSize, this.font.family, line, angle, clockwise);

          var pathLine = document.createElementNS('http://www.w3.org/2000/svg','path');
          pathLine.setAttribute('id','pathLine'+ i);
          pathLine.setAttribute('d', dd);
          pathLine.setAttribute('fill', 'none');
          pathLine.setAttribute('stroke', 'red');

          clipartClone.appendChild(pathLine);

          const textArcPath = document.createElementNS('http://www.w3.org/2000/svg','textPath');
          textArcPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#pathLine' + i);
          textArcPath.setAttribute('startOffset', '50%');
          textArcPath.setAttribute('text-anchor', 'middle');
          textArcPath.innerHTML = line;

          text.appendChild(textArcPath);
          text.style.fontSize = fontSize.toString();
          text.style.fontFamily = font_name;
          text.style.letterSpacing = this.element.letterSpacing + 'px';
          text.style.fill = this.element.fill.rgb;

          if (dropShadow.enabled) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
            const filter = document.createElementNS('http://www.w3.org/2000/svg','filter');
            filter.setAttribute('id', 'shadow');
            const feOffset = document.createElementNS('http://www.w3.org/2000/svg','feOffset');
            feOffset.setAttribute('dx', (dropShadow.xOffset / 10.0).toString());
            feOffset.setAttribute('dy', (dropShadow.yOffset / 10.0).toString());
            filter.appendChild(feOffset);
            defs.appendChild(filter);
            const textDropShadow = document.createElementNS('http://www.w3.org/2000/svg','text');
            textDropShadow.style.fill = dropShadow.color.rgb;
            textDropShadow.style.fontSize = fontSize.toString();
            textDropShadow.style.fontFamily = font_name;
            textDropShadow.style.letterSpacing = this.element.letterSpacing + 'px';
            textDropShadow.setAttribute('filter', 'url(#shadow)');
            
            const textArcPathDropShadow = document.createElementNS('http://www.w3.org/2000/svg','textPath');
            textArcPathDropShadow.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#pathLine' + i);
            textArcPathDropShadow.setAttribute('startOffset', '50%');
            textArcPathDropShadow.setAttribute('text-anchor', 'middle');
            textArcPathDropShadow.innerHTML = line;
            clipartClone.appendChild(defs);
            clipartClone.appendChild(textDropShadow);
            textDropShadow.appendChild(textArcPathDropShadow);
          }

          if (outlineTwo.enabled && outline.enabled) {

            const textOutlineTwo = document.createElementNS('http://www.w3.org/2000/svg','text');
            textOutlineTwo.style.stroke = outlineTwo.color.rgb;
            textOutlineTwo.style.strokeWidth = (outlineTwo.thickness / 5.0 + outline.thickness / 5.0).toString();
            textOutlineTwo.style.fontSize = fontSize.toString();
            textOutlineTwo.style.fontFamily = font_name;
            textOutlineTwo.style.letterSpacing = this.element.letterSpacing + 'px';

            const textArcPathOutlineTwo = document.createElementNS('http://www.w3.org/2000/svg','textPath');
            textArcPathOutlineTwo.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#pathLine' + i);
            textArcPathOutlineTwo.setAttribute('startOffset', '50%');
            textArcPathOutlineTwo.setAttribute('text-anchor', 'middle');
            clipartClone.appendChild(textOutlineTwo);
            textOutlineTwo.appendChild(textArcPathOutlineTwo);
            textArcPathOutlineTwo.innerHTML = line;
            clipartClone.appendChild(textOutlineTwo);

            const textOutline = document.createElementNS('http://www.w3.org/2000/svg','text');
            textOutline.style.stroke = outline.color.rgb;
            textOutline.style.strokeWidth = (outline.thickness / 5.0).toString();
            textOutline.style.fontSize = fontSize.toString();
            textOutline.style.fontFamily = font_name;
            textOutline.style.letterSpacing = this.element.letterSpacing + 'px';

            const textArcPathOutline = document.createElementNS('http://www.w3.org/2000/svg','textPath');
            textArcPathOutline.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#pathLine' + i);
            textArcPathOutline.setAttribute('startOffset', '50%');
            textArcPathOutline.setAttribute('text-anchor', 'middle');
            clipartClone.appendChild(textOutline);
            textOutline.appendChild(textArcPathOutline);
            textArcPathOutline.innerHTML = line;
            clipartClone.appendChild(textOutline);

          } else if (outlineTwo.enabled || outline.enabled) {
            var thickness = outlineTwo.enabled ? outlineTwo.thickness / 5.0 : outline.thickness / 5.0;
            var color = outlineTwo.enabled ? outlineTwo.color.rgb : outline.color.rgb;
            const textOutlineTwo = document.createElementNS('http://www.w3.org/2000/svg','text');
            textOutlineTwo.style.stroke = color;
            textOutlineTwo.style.strokeWidth = thickness.toString();
            textOutlineTwo.style.fontSize = fontSize.toString();
            textOutlineTwo.style.fontFamily = font_name;
            textOutlineTwo.style.letterSpacing = this.element.letterSpacing + 'px';

            const textArcPathOutlineTwo = document.createElementNS('http://www.w3.org/2000/svg','textPath');
            textArcPathOutlineTwo.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#pathLine' + i);
            textArcPathOutlineTwo.setAttribute('startOffset', '50%');
            textArcPathOutlineTwo.setAttribute('text-anchor', 'middle');
            clipartClone.appendChild(textOutlineTwo);
            textOutlineTwo.appendChild(textArcPathOutlineTwo);
            textArcPathOutlineTwo.innerHTML = line;
            clipartClone.appendChild(textOutlineTwo);
          }
          clipartClone.appendChild(text);
        });
        const svgDoc = this.element.area.design.svgRoot.node.cloneNode() as SVGElement;
        svgDoc.setAttribute('id', 'clipartCanvas');
        svgDoc.setAttribute('preserveAspectRatio', 'none');
        svgDoc.appendChild(clipartClone);
        svgDoc.setAttribute('viewBox', -100 + ' ' + -100 + ' ' + (w * 3 + 100) + ' ' + (h * 3 + 100) );

        //scale for original arch text size when rotaion degree is zero.
        var boxWidth = h * Math.abs( Math.sin( angleInRadians(this.element.rotationDegrees) ) )
                      + w * Math.abs( Math.cos( angleInRadians(this.element.rotationDegrees) ) );
        var boxHeight = h * Math.abs( Math.cos( angleInRadians(this.element.rotationDegrees) ) )
                      + w * Math.abs( Math.sin( angleInRadians(this.element.rotationDegrees) ) );
        console.log(boxWidth);
        console.log(boxHeight);
        const scaleW = boxWidth / this.element.width;
        const scaleH = this.element.width / this.element.height * boxHeight / boxWidth * scaleW;
        this.element.scale(scaleW, scaleH);
        
        const svgImg = new Image();
        svgImg.onload = () => {
          textCanvas.context.drawImage(svgImg, 0, 0);

          observer.next(textCanvas);
          observer.complete();
        };
        svgImg.onerror = (err) => {
          console.error('error loading svgImg: %o', err);
          observer.error(new Error('error loading svgImg: ' + err));
        };
        svgImg.src = 'data:image/svg+xml;base64,' + btoa(svgDoc.outerHTML);
      });
    });
  }
}
