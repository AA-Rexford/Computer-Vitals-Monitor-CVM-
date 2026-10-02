with open("src/App.css", "r") as f:
    css = f.read()

# Replace home-box styles
start_idx = css.find(".home-box {")
end_idx = css.find(".home-box h2 {", start_idx)

new_box_style = """
.home-box {
  background: radial-gradient(circle at center, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
  border: 2px solid rgba(0, 255, 255, 0.5);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(15px);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(0, 255, 255, 0.05);
  padding: 1rem;
  overflow: hidden;
}
.home-box:hover {
  transform: translateY(-5px) scale(1.02);
  border-color: #00ffff;
  background: radial-gradient(circle at center, rgba(0, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.9) 100%);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.8), inset 0 0 20px rgba(0, 255, 255, 0.4);
}
"""

css = css[:start_idx] + new_box_style + css[css.find(".home-box h2 {"):]

# Replace h2 and svg
start_idx2 = css.find(".home-box h2 {")
end_idx2 = css.find(".app-header {", start_idx2) # or next major block

new_h2_svg = """
.home-box h2 {
  color: #ffffff;
  font-size: clamp(1.2rem, 3.5vw, 2.5rem);
  font-weight: 900;
  letter-spacing: clamp(1px, 0.5vw, 4px);
  text-transform: uppercase;
  text-align: center;
  margin: 0;
  width: 100%;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.6);
}
.home-box svg {
  width: clamp(50px, 8vw, 90px);
  height: clamp(50px, 8vw, 90px);
  color: #00ffff;
  margin-bottom: clamp(0.5rem, 2vw, 1.5rem);
  filter: drop-shadow(0 0 15px rgba(0, 255, 255, 1)) drop-shadow(0 0 30px rgba(0, 255, 255, 0.6));
}
"""

css = css[:start_idx2] + new_h2_svg + css[end_idx2:]

with open("src/App.css", "w") as f:
    f.write(css)
