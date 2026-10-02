import re

with open("src/App.css", "r") as f:
    css = f.read()

# Replace .home-box styles
new_home_box = """
.home-box {
  background: rgba(10, 20, 30, 0.6);
  border: 2px solid rgba(0, 229, 255, 0.3);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  box-shadow: 0 0 25px rgba(0, 229, 255, 0.15), inset 0 0 20px rgba(0, 229, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(10px);
}

.home-box::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at center, rgba(0, 229, 255, 0.15) 0%, transparent 70%);
  opacity: 0.5;
  transition: opacity 0.3s;
}

.home-box:hover {
  transform: translateY(-10px) scale(1.03);
  box-shadow: 0 0 50px rgba(0, 229, 255, 0.4), inset 0 0 30px rgba(0, 229, 255, 0.2);
  border-color: #00e5ff;
}

.home-box:hover::before {
  opacity: 1;
}

.home-box-icon {
  color: #00e5ff;
  filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.6));
  transition: all 0.3s;
  z-index: 1;
}

.home-box:hover .home-box-icon {
  color: #fff;
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8));
  transform: scale(1.15);
}

.home-box-name {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 3px;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  z-index: 1;
  transition: all 0.3s;
}

.home-box:hover .home-box-name {
  color: #00e5ff;
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.8);
}
"""

css = re.sub(r'\.home-box \{.*?(?=\/\*|\Z)', new_home_box, css, flags=re.DOTALL)

with open("src/App.css", "w") as f:
    f.write(css)

