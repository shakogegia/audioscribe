IMAGE_NAME := audioscribe
CONTAINER_NAME := audioscribe
DOCKER_REPO ?= shakogegia/audioscribe
PORT ?= 3000
VOLUME_NAME := audioscribe-data

RUN_ENV :=
ifdef SESSION_SECRET
RUN_ENV += -e SESSION_SECRET=$(SESSION_SECRET)
endif
ifdef AUTH_EMAIL
RUN_ENV += -e AUTH_EMAIL=$(AUTH_EMAIL)
endif
ifdef AUTH_PASSWORD
RUN_ENV += -e AUTH_PASSWORD=$(AUTH_PASSWORD)
endif

.PHONY: dev build run stop logs push clean shell

dev:
	concurrently "pnpm dev" "python3 -m scripts.worker" "chroma run --path ./data/chromadb"

build:
	docker build -t $(IMAGE_NAME) .

run: build
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):3000 \
		--memory=10g \
		--memory-reservation=4g \
		--shm-size=2g \
		$(RUN_ENV) \
		-v $(VOLUME_NAME):/app/data \
		$(IMAGE_NAME)
	@echo "Running at http://localhost:$(PORT)"

stop:
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)

logs:
	docker logs -f $(CONTAINER_NAME)

shell:
	docker exec -it $(CONTAINER_NAME) sh

push:
	docker buildx build --platform linux/amd64,linux/arm64 -t $(DOCKER_REPO):latest --push .

clean: stop
	-docker rmi $(IMAGE_NAME)
	-docker volume rm $(VOLUME_NAME)
