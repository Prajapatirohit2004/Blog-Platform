import { useState } from "react";

const projects = [
  {
    title: "Modern UI Case Study",
    description:
      "A polished responsive frontend that highlights a clean portfolio experience with strong typography and visually distinctive cards.",
    tags: ["React", "TypeScript", "Vite"],
  },
  {
    title: "Interactive Blog Demo",
    description:
      "A full-stack blog example featuring authentication, post creation, comments, and an Express backend API.",
    tags: ["Express", "REST API", "JSON storage"],
  },
  {
    title: "Landing Page Refresh",
    description:
      "A simple landing page designed for strong mobile readability, subtle animations, and a modern developer portfolio layout.",
    tags: ["CSS", "Responsive", "Design"],
  },
];

const skills = [
  "React",
  "TypeScript",
  "Vite",
  "HTML & CSS",
  "Responsive design",
  "API integration",
];

const experience = [
  {
    year: "2025",
    title: "Frontend Developer",
    company: "Freelance Projects",
    summary: "Built responsive landing pages, portfolio interfaces, and web experiences for small businesses.",
  },
  {
    year: "2024",
    title: "Web App Prototype",
    company: "Personal Studio",
    summary: "Delivered a full-stack blog platform with user authentication and comment workflows.",
  },
];

export default function App() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">Rohit Prajapati</div>
        <button
          className="nav-toggle"
          onClick={() => setNavOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <nav className={navOpen ? "site-nav open" : "site-nav"}>
          <a href="#about">About</a>
          <a href="#projects">Work</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div>
            <span className="eyebrow">Personal Portfolio</span>
            <h1>Crafting Web Experiences with Clean Code and Confident Design.</h1>
            <p>
              I build modern, responsive websites and web apps using React, TypeScript,
              and expressive UI patterns that feel polished on every screen.
            </p>
            <div className="hero-actions">
              <a href="#projects" className="button primary">
                View work
              </a>
              <a href="#contact" className="button secondary">
                Get in touch
              </a>
            </div>
          </div>
          <div className="hero-card">
            <p className="hero-card-title">Quick snapshot</p>
            <ul>
              <li>Frontend apps with strong visual hierarchy</li>
              <li>Clean portfolio sections and project storytelling</li>
              <li>Built with React, Vite, and TypeScript</li>
            </ul>
          </div>
        </section>

        <section id="about" className="section about-section">
          <div className="section-heading">
            <span>About Me</span>
            <h2>Designer-first thinking with a developer's focus.</h2>
          </div>
          <div className="about-grid">
            <div>
              <p>
                I specialize in building intuitive web interfaces that feel smooth and
                modern while keeping performance and accessibility top of mind.
              </p>
              <p>
                Every project starts with a strong content hierarchy, clear visual rhythm,
                and thoughtful interactions that help users move through information.
              </p>
            </div>
            <div className="skill-list">
              {skills.map((skill) => (
                <span key={skill} className="skill-pill">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="section projects-section">
          <div className="section-heading">
            <span>Featured Work</span>
            <h2>Selected projects that show process and polish.</h2>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              <article key={project.title} className="project-card">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="tag-row">
                  {project.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="section experience-section">
          <div className="section-heading">
            <span>Experience</span>
            <h2>How my work has evolved over time.</h2>
          </div>
          <div className="timeline">
            {experience.map((item) => (
              <div key={item.year} className="timeline-item">
                <span className="timeline-year">{item.year}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p className="timeline-company">{item.company}</p>
                  <p>{item.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="section contact-section">
          <div className="section-heading">
            <span>Contact</span>
            <h2>Ready to build something together?</h2>
          </div>
          <div className="contact-grid">
            <div>
              <p>
                If you want a clean website, a portfolio refresh, or a new web app,
                send a message and let&apos;s talk about your next project.
              </p>
              <p>
                <strong>Email:</strong> hello@example.com
              </p>
              <p>
                <strong>Location:</strong> Remote / Online
              </p>
            </div>
            <form className="contact-card" onSubmit={(event) => event.preventDefault()}>
              <label>
                Name
                <input type="text" placeholder="Your name" />
              </label>
              <label>
                Email
                <input type="email" placeholder="you@example.com" />
              </label>
              <label>
                Message
                <textarea placeholder="Tell me about your project" rows={5} />
              </label>
              <button type="submit" className="button primary">
                Send message
              </button>
            </form>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <p>Designed and built with React + TypeScript.</p>
      </footer>
    </div>
  );
}
