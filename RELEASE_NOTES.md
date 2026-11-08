React components for fleet capabilities, profiles, settings, reviewed approvals, rollout progress and activity, with a C2I card JSON adapter.

- Install the library tarball in your React application with `npm install /path/to/millerjem-fleet-capability-cards-0.1.0.tgz`.
- The demo container is exported as `fleet-capability-cards-demo.tar.gz` (Linux amd64). Load it with `docker load -i fleet-capability-cards-demo.tar.gz`, then run `docker run --rm -p 127.0.0.1:8080:8080 fleet-capability-cards:demo`.
- For other architectures, build the image from the repository with `docker compose up --build`.
- Open http://localhost:8080. The demo uses synthetic data and simulated approvals and rollouts; no backend or credentials are needed.

See the repository README for component props, styling, and application/backend integration. The package is distributed through GitHub Releases and has not been published to npm.
